// 日報データ解析スクリプト

class DailyReportAnalyzer {
    constructor() {
        this.reports = [];
        this.reportFiles = [];
    }

    // 日報ファイルのリストを取得
    async findReportFiles() {
        // 日報ファイル名のパターン（YYYY-MM-DD_日報.md）
        const reportPattern = /^\d{4}-\d{2}-\d{2}_日報\.md$/;
        
        // 既知の日報ファイルをハードコード（実際のファイルシステムアクセスの代替）
        this.reportFiles = [
            '2025-11-03_日報.md',
            '2025-11-04_日報.md',
            '2025-11-05_日報.md',
            '2025-11-06_日報.md',
            '2025-11-07_日報.md',
            '2025-11-08_日報.md'
        ];
        
        return this.reportFiles;
    }

    // 日報ファイルを読み込む
    async loadReport(filename) {
        try {
            const response = await fetch(filename);
            if (!response.ok) {
                console.warn(`ファイル ${filename} の読み込みに失敗しました`);
                return null;
            }
            const content = await response.text();
            return this.parseReport(content, filename);
        } catch (error) {
            console.error(`エラー: ${filename}`, error);
            return null;
        }
    }

    // 日報の内容を解析
    parseReport(content, filename) {
        const report = {
            filename: filename,
            date: this.extractDate(content, filename),
            tasks: [],
            achievements: [],
            issues: [],
            tomorrow: [],
            totalHours: 0,
            rating: 0,
            insights: []
        };

        // 業務内容を抽出
        report.tasks = this.extractTasks(content);
        
        // 総業務時間を計算
        report.totalHours = report.tasks.reduce((sum, task) => sum + task.hours, 0);
        
        // 成果・達成事項を抽出
        report.achievements = this.extractAchievements(content);
        
        // 課題・問題点を抽出
        report.issues = this.extractIssues(content);
        
        // 明日の予定を抽出
        report.tomorrow = this.extractTomorrow(content);
        
        // 総合評価を抽出
        report.rating = this.extractRating(content);
        
        // 所感・気づきを抽出
        report.insights = this.extractInsights(content);

        return report;
    }

    // 日付を抽出
    extractDate(content, filename) {
        // ファイル名から日付を抽出
        const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
        if (match) {
            return match[1];
        }
        
        // コンテンツから日付を抽出
        const dateMatch = content.match(/\*\*日付\*\*:\s*(\d{4})年(\d{1,2})月(\d{1,2})日/);
        if (dateMatch) {
            const year = dateMatch[1];
            const month = dateMatch[2].padStart(2, '0');
            const day = dateMatch[3].padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        
        return 'unknown';
    }

    // 業務内容を抽出
    extractTasks(content) {
        const tasks = [];
        const taskPattern = /###\s*業務\d+:\s*(.+?)\n([\s\S]*?)(?=###|---|\n##|$)/g;
        
        let match;
        while ((match = taskPattern.exec(content)) !== null) {
            const taskName = match[1].trim();
            const taskContent = match[2];
            
            // 所要時間を抽出
            const timeMatch = taskContent.match(/\*\*所要時間\*\*:\s*約?([\d.]+)\s*時間/);
            const hours = timeMatch ? parseFloat(timeMatch[1]) : 0;
            
            // 進捗状況を抽出
            const progressMatch = taskContent.match(/\*\*進捗状況\*\*:\s*(.+?)(?:\n|$)/);
            const progress = progressMatch ? progressMatch[1].trim() : '不明';
            
            // タスクのカテゴリを推定
            const category = this.categorizeTask(taskName);
            
            tasks.push({
                name: taskName,
                hours: hours,
                progress: progress,
                category: category
            });
        }
        
        return tasks;
    }

    // タスクをカテゴリ分類
    categorizeTask(taskName) {
        const categories = {
            '会議・ミーティング': ['ミーティング', '会議', '1on1', '報告会'],
            '顧客対応': ['顧客', '商談', '提案', '問い合わせ'],
            '資料作成': ['資料', 'レポート', '準備'],
            '企画・検討': ['企画', '検討', '分析'],
            '講座・教育': ['講座', 'Cursor'],
            'その他': []
        };
        
        for (const [category, keywords] of Object.entries(categories)) {
            for (const keyword of keywords) {
                if (taskName.includes(keyword)) {
                    return category;
                }
            }
        }
        
        return 'その他';
    }

    // 成果・達成事項を抽出
    extractAchievements(content) {
        const achievements = [];
        const section = content.match(/##\s*本日の成果・達成事項\n([\s\S]*?)(?=\n##|---)/);
        
        if (section) {
            const lines = section[1].split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('-')) {
                    achievements.push(trimmed.substring(1).trim());
                }
            }
        }
        
        return achievements;
    }

    // 課題・問題点を抽出
    extractIssues(content) {
        const issues = [];
        const section = content.match(/##\s*課題・問題点\n([\s\S]*?)(?=\n##|---)/);
        
        if (section) {
            const issuePattern = /\*\*課題\d+\*\*:\s*(.+?)(?:\n|$)/g;
            let match;
            
            while ((match = issuePattern.exec(section[1])) !== null) {
                issues.push(match[1].trim());
            }
        }
        
        return issues;
    }

    // 明日の予定を抽出
    extractTomorrow(content) {
        const tomorrow = [];
        const section = content.match(/##\s*明日の予定\n([\s\S]*?)(?=\n##|---)/);
        
        if (section) {
            const lines = section[1].split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('- [')) {
                    tomorrow.push(trimmed.replace(/^- \[.\]\s*/, '').trim());
                }
            }
        }
        
        return tomorrow;
    }

    // 総合評価を抽出
    extractRating(content) {
        const match = content.match(/\*\*総合評価\*\*:\s*([⭐]+)/);
        if (match) {
            return match[1].length;
        }
        return 0;
    }

    // 所感・気づきを抽出
    extractInsights(content) {
        const insights = [];
        const section = content.match(/##\s*所感・気づき\n([\s\S]*?)(?=\n##|---)/);
        
        if (section) {
            const lines = section[1].split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('-')) {
                    insights.push(trimmed.substring(1).trim());
                }
            }
        }
        
        return insights;
    }

    // 全日報を読み込んで解析
    async analyzeAll() {
        await this.findReportFiles();
        
        for (const file of this.reportFiles) {
            const report = await this.loadReport(file);
            if (report) {
                this.reports.push(report);
            }
        }
        
        // 日付順にソート
        this.reports.sort((a, b) => a.date.localeCompare(b.date));
        
        return this.generateAnalytics();
    }

    // 統計情報を生成
    generateAnalytics() {
        const analytics = {
            totalDays: this.reports.length,
            totalHours: 0,
            averageHours: 0,
            averageRating: 0,
            tasksByCategory: {},
            hoursByCategory: {},
            allTasks: [],
            allAchievements: [],
            allIssues: [],
            dailyData: []
        };

        // 日別データと集計
        for (const report of this.reports) {
            analytics.totalHours += report.totalHours;
            
            // タスクのカテゴリ別集計
            for (const task of report.tasks) {
                if (!analytics.tasksByCategory[task.category]) {
                    analytics.tasksByCategory[task.category] = 0;
                    analytics.hoursByCategory[task.category] = 0;
                }
                analytics.tasksByCategory[task.category]++;
                analytics.hoursByCategory[task.category] += task.hours;
                
                analytics.allTasks.push({
                    date: report.date,
                    ...task
                });
            }
            
            // 成果・課題を収集
            analytics.allAchievements.push(...report.achievements.map(a => ({
                date: report.date,
                achievement: a
            })));
            
            analytics.allIssues.push(...report.issues.map(i => ({
                date: report.date,
                issue: i
            })));
            
            // 日別データ
            analytics.dailyData.push({
                date: report.date,
                hours: report.totalHours,
                rating: report.rating,
                taskCount: report.tasks.length,
                completedTasks: report.tasks.filter(t => t.progress === '完了').length,
                insights: report.insights
            });
        }

        // 平均値の計算
        if (analytics.totalDays > 0) {
            analytics.averageHours = analytics.totalHours / analytics.totalDays;
            analytics.averageRating = this.reports.reduce((sum, r) => sum + r.rating, 0) / analytics.totalDays;
        }

        return {
            reports: this.reports,
            analytics: analytics
        };
    }
}

// グローバルに公開
window.DailyReportAnalyzer = DailyReportAnalyzer;



