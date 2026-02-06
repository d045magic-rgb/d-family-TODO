// daily_quests.js
// デイリークエストの設定と曜日判定ロジック

// 1. 基本のクエストリスト
const baseDailyQuests = [
    { id: 'd1', text: "ログインボーナス（クリックで受取）", xp: 10, completed: false },
    { id: 'd2', text: "タスクを1つ完了する", xp: 30, completed: false },
    { id: 'd3', text: "風呂掃除/ご飯作り/皿洗いのどれかをする", xp: 50, completed: false }
];

// 2. 今日のクエストを作成する関数（重要！）
// index.html からこの関数が呼び出されます
function getDailyQuestsForToday() {
    // 基本リストをコピー
    const quests = JSON.parse(JSON.stringify(baseDailyQuests));

    // 今日の曜日を取得 (0=日, 1=月 ... 6=土)
    const todayDay = new Date().getDay();

    // ロジック：日(0)～木(4)の夜は、翌日（平日）の学校の準備が必要
    if (todayDay >= 0 && todayDay <= 4) {
        quests.push({
            id: 'd_school',
            text: "明日の学校の準備（リュック確認）",
            xp: 20,
            completed: false
        });
    }

    return quests;
}