// achievements.js
// アチーブメント（実績）のマスターデータ

const masterAchievements = [
    { 
        id: 1, 
        text: "初任務完了：最初のタスクをクリア", 
        xpReward: 50, 
        // 条件：タスク完了数が1以上
        condition: (tasks, total) => total >= 1 
    },
    { 
        id: 2, 
        text: "見習い脱出：3つのタスクをクリア", 
        xpReward: 100, 
        condition: (tasks, total) => total >= 3 
    },
    { 
        id: 3, 
        text: "ベテランの風格：5つのタスクをクリア", 
        xpReward: 200, 
        condition: (tasks, total) => total >= 5 
    },
    { 
        id: 4, 
        text: "プロ冒険者：10個のタスクをクリア", 
        xpReward: 500, 
        condition: (tasks, total) => total >= 10 
    },
    // 特定の言葉を含むタスクの判定例
    {
        id: 5,
        text: "筋トレ開始：「筋トレ」を含むタスクを完了",
        xpReward: 300,
        condition: (tasks, total) => tasks.some(t => t.text.includes("筋トレ") && t.completed)
    }
    {
        id: 5,
        text: "息抜き大事：「ゲーム」を含むタスクを完了",
        xpReward: 300,
        condition: (tasks, total) => tasks.some(t => t.text.includes("ゲーム") && t.completed)
    }
];