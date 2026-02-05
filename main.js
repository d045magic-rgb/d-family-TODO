// main.js - ゲームロジック本体

// --- グローバル変数 ---
let xp = 0;
let level = 1;
let totalTasksCompleted = 0;
let myTasks = [];
let myDailyQuests = [];
let activeAchievements = [];
let completedDevQuests = [];
let streakCount = 0;
let lastAllClearDate = "";
let inventory = { ticket500: 0, gameTime: 0, bathPass: 0 };
let customDevQuests = [];
let archivedDevQuests = [];
let archivedTasks = [];

// --- 起動処理 ---
window.onload = function() {
    loadGameData();
    
    // デイリー緊急修復
    if (!myDailyQuests || myDailyQuests.length === 0) {
        if (typeof getDailyQuestsForToday === "function") {
            myDailyQuests = getDailyQuestsForToday();
        } else {
            myDailyQuests = [
                { id: 'd1', text: "ログインボーナス", xp: 10, completed: false },
                { id: 'd2', text: "タスクを1つ完了", xp: 30, completed: false },
                { id: 'd3', text: "運動する", xp: 50, completed: false }
            ];
        }
    }

    checkDate(); // 日付変更(デイリー/週次/アーカイブ)チェック
    renderAll();
    renderDevQuests();
};

// --- 描画関数 ---
function renderDevQuests() {
    const container = document.getElementById("devQuestList");
    container.innerHTML = "";

    let fileQuests = [];
    if (typeof devQuestsData !== 'undefined') {
        fileQuests = devQuestsData;
    }

    const allQuests = [...fileQuests, ...customDevQuests];

    if (allQuests.length === 0) {
        container.innerHTML = "<div style='color:#555; padding:10px;'>依頼はありません</div>";
        return;
    }

    allQuests.forEach(q => {
        const isArchived = archivedDevQuests.some(aq => aq.id === q.id);
        if (isArchived) return;

        const isCleared = completedDevQuests.includes(q.id);
        const isCustom = q.id.startsWith("custom_") || q.id.startsWith("sys_");
        
        const card = document.createElement("div");
        card.className = "quest-card" + (isCleared ? " cleared" : "");
        
        let deleteBtnHtml = "";
        if (isCustom && !isCleared) {
            deleteBtnHtml = `<button class="btn-delete-quest" onclick="deleteCustomQuest('${q.id}')">×</button>`;
        }

        card.innerHTML = `
            ${deleteBtnHtml}
            <div class="quest-header">
                <span class="quest-title">${q.title}</span>
                <span class="quest-rank">${q.rank}</span>
            </div>
            <div class="quest-details">
                <span>依頼主: ${q.client}</span>
                <span>報酬金: ${q.rewardXP} XP</span>
                <span>制限: ${q.limit}</span>
            </div>
            <div class="quest-desc">${q.desc}</div>
            <button class="btn-accept" 
                onclick="completeDevQuest('${q.id}', ${q.rewardXP})">
                ${isCleared ? '達成済み' : 'クエスト達成'}
            </button>
        `;
        container.appendChild(card);
    });
}

function completeDevQuest(id, rewardXP) {
    if (completedDevQuests.includes(id)) return;
    if (confirm("依頼を達成し、報酬を受け取りますか？")) {
        completedDevQuests.push(id);
        addXP(rewardXP);
        renderDevQuests();
        saveGameData();
    }
}

// --- 新規クエスト作成 ---
function openCreateQuestModal() {
    document.getElementById("newQuestTitle").value = "";
    document.getElementById("newQuestDesc").value = "";
    document.getElementById("createQuestModal").style.display = "flex";
}
function closeCreateQuestModal() { document.getElementById("createQuestModal").style.display = "none"; }

function submitNewQuest() {
    const title = document.getElementById("newQuestTitle").value;
    const desc = document.getElementById("newQuestDesc").value;
    const rank = document.getElementById("newQuestRank").value;
    const xpVal = parseInt(document.getElementById("newQuestXP").value) || 0;
    const client = document.getElementById("newQuestClient").value;
    const limit = document.getElementById("newQuestLimit").value;

    if (!title) { alert("クエスト名を入力してください"); return; }

    const newQuest = {
        id: "custom_" + Date.now(),
        title: title, rank: rank, client: client, rewardXP: xpVal, limit: limit, desc: desc
    };

    customDevQuests.push(newQuest);
    saveGameData();
    renderDevQuests();
    closeCreateQuestModal();
    alert("新規依頼書を発行しました！");
}

function deleteCustomQuest(id) {
    if(confirm("この依頼書を破棄しますか？")) {
        customDevQuests = customDevQuests.filter(q => q.id !== id);
        saveGameData();
        renderDevQuests();
    }
}

// --- データ保存・読込 ---
function saveGameData() {
    const achievementState = activeAchievements.map(a => ({ id: a.id, unlocked: a.unlocked, claimed: a.claimed }));
    const pName = document.getElementById("playerName").value;
    const wGoal = document.getElementById("weeklyGoal").value;

    const data = {
        xp: xp, level: level, totalTasks: totalTasksCompleted, achievementState: achievementState,
        dailyQuests: myDailyQuests, tasks: myTasks, profile: { name: pName, goal: wGoal }, devQuests: completedDevQuests,
        streak: streakCount, lastClear: lastAllClearDate, inv: inventory,
        customDevQuests: customDevQuests,
        archivedDevQuests: archivedDevQuests,
        archivedTasks: archivedTasks
    };
    localStorage.setItem("cyberQuestData", JSON.stringify(data));
    updateStatusUI();
}

function loadGameData() {
    const savedJSON = localStorage.getItem("cyberQuestData");
    if (typeof masterAchievements !== 'undefined') {
        activeAchievements = masterAchievements.map(m => ({ ...m, unlocked: false, claimed: false }));
    }

    if (savedJSON) {
        const data = JSON.parse(savedJSON);
        xp = data.xp || 0; level = data.level || 1; totalTasksCompleted = data.totalTasks || 0;
        myTasks = data.tasks || []; completedDevQuests = data.devQuests || [];
        customDevQuests = data.customDevQuests || [];
        archivedDevQuests = data.archivedDevQuests || [];
        archivedTasks = data.archivedTasks || [];

        if (data.profile) {
            document.getElementById("playerName").value = data.profile.name || "";
            document.getElementById("weeklyGoal").value = data.profile.goal || "";
        }
        if (data.dailyQuests && data.dailyQuests.length > 0) myDailyQuests = data.dailyQuests;
        
        if (data.achievementState && activeAchievements.length > 0) {
            activeAchievements.forEach(act => {
                const savedState = data.achievementState.find(s => s.id === act.id);
                if (savedState) { act.unlocked = savedState.unlocked; act.claimed = savedState.claimed; }
            });
        }
        streakCount = data.streak || 0;
        lastAllClearDate = data.lastClear || "";
        inventory = data.inv || { ticket500: 0, gameTime: 0, bathPass: 0 };
    }
}

// --- 日付変更チェック ---
function checkDate() {
    const todayStr = new Date().toLocaleDateString();
    const lastLogin = localStorage.getItem("lastLoginDate");

    if (lastLogin !== todayStr) {
        console.log("日付変更処理を実行");

        // 1. セルフタスクアーカイブ
        const activeTasks = [];
        myTasks.forEach(t => {
            if (t.completed) {
                t.archivedDate = lastLogin || "不明な日付";
                archivedTasks.push(t);
            } else {
                activeTasks.push(t);
            }
        });
        myTasks = activeTasks;

        // 2. クエストアーカイブ
        let fileQuests = (typeof devQuestsData !== 'undefined') ? devQuestsData : [];
        const allQuests = [...fileQuests, ...customDevQuests];

        completedDevQuests.forEach(id => {
            const qObj = allQuests.find(q => q.id === id);
            if (qObj) {
                const archQ = JSON.parse(JSON.stringify(qObj));
                archQ.archivedDate = lastLogin || "不明な日付";
                archivedDevQuests.push(archQ);
            }
        });
        customDevQuests = customDevQuests.filter(q => !completedDevQuests.includes(q.id));
        completedDevQuests = [];

        // 3. 週次リセット (月曜判定)
        const currentMonday = getMonday(new Date(todayStr));
        const lastMonday = localStorage.getItem("lastWeeklyMonday");

        if (lastMonday !== currentMonday) {
            document.getElementById("weeklyGoal").value = "";
            localStorage.setItem("lastWeeklyMonday", currentMonday);
            
            const weeklyQuest = {
                id: "sys_weekly_" + Date.now(),
                title: "【定期】今週の目標設定",
                rank: "★1",
                client: "システム",
                rewardXP: 50,
                limit: "今週中",
                desc: "左上のプロフィール欄にある「TARGET」に、今週の目標を入力せよ。"
            };
            customDevQuests.push(weeklyQuest);
            alert("新しい週が始まりました！\n今週の目標をリセットしました。");
        }

        // 4. デイリーリセット
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString();
        if (lastAllClearDate !== yesterdayStr && lastAllClearDate !== todayStr && lastAllClearDate !== "") {
            streakCount = 0; alert("連続クリア記録が途切れました...");
        }
        if (typeof getDailyQuestsForToday === "function") myDailyQuests = getDailyQuestsForToday();
        
        localStorage.setItem("lastLoginDate", todayStr);
        saveGameData();
        if (lastLogin) location.reload();
    }
}

function getMonday(d) {
    d = new Date(d);
    var day = d.getDay(), diff = d.getDate() - day + (day == 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toLocaleDateString();
}

// --- アーカイブ閲覧 ---
function openArchivedQuestsModal() {
    const container = document.getElementById("archivedQuestsContainer");
    if (archivedDevQuests.length === 0) {
        container.innerHTML = "<p style='color:#777;'>まだアーカイブされたクエストはありません。</p>";
    } else {
        let html = "";
        [...archivedDevQuests].reverse().forEach(q => {
            html += `<div class="archive-item"><span class="archive-date">📅 ${q.archivedDate || '---'} 達成</span><strong style="color:#e94560;">[${q.rank}] ${q.title}</strong><br><span style="color:#888;">報酬: ${q.rewardXP} XP / 依頼主: ${q.client}</span></div>`;
        });
        container.innerHTML = html;
    }
    document.getElementById("archivedQuestsModal").style.display = "flex";
}

function openArchivedTasksModal() {
    const container = document.getElementById("archivedTasksContainer");
    if (archivedTasks.length === 0) {
        container.innerHTML = "<p style='color:#777;'>まだアーカイブされたタスクはありません。</p>";
    } else {
        let html = "";
        [...archivedTasks].reverse().forEach(t => {
            html += `<div class="archive-item"><span class="archive-date">📅 ${t.archivedDate || '---'} 達成</span><span style="color:#fff;">✅ ${t.text}</span></div>`;
        });
        container.innerHTML = html;
    }
    document.getElementById("archivedTasksModal").style.display = "flex";
}

// --- アクション ---
function clickDaily(idx) {
    if (!myDailyQuests[idx] || myDailyQuests[idx].completed) return;
    myDailyQuests[idx].completed = true;
    addXP(myDailyQuests[idx].xp);
    renderDaily();
    saveGameData();
}

function renderDaily() {
    const div = document.getElementById("dailyList");
    const section = document.getElementById("dailySection");
    const streakDisp = document.getElementById("streakDisplay");
    div.innerHTML = "";
    
    if (myDailyQuests.length === 0) { div.innerHTML = "No Missions"; return; }
    const isAllCleared = myDailyQuests.every(q => q.completed);
    
    if (isAllCleared) { if(section) section.classList.add("all-cleared"); handleDailyAllClear(); }
    else { if(section) section.classList.remove("all-cleared"); }

    if(streakDisp) streakDisp.innerText = `連続 ${streakCount}日目`;
    myDailyQuests.forEach((q, idx) => {
        const item = document.createElement("div");
        item.className = "daily-item" + (q.completed ? " completed" : "");
        item.innerHTML = `<span>★ ${q.text}</span> <span>+${q.xp}XP</span>`;
        item.onclick = () => clickDaily(idx);
        div.appendChild(item);
    });
}

function handleDailyAllClear() {
    const todayStr = new Date().toLocaleDateString();
    if (lastAllClearDate === todayStr) return;
    lastAllClearDate = todayStr;
    streakCount++;
    if (streakCount >= 3) { setTimeout(() => { document.getElementById("rewardSelectModal").style.display = "flex"; }, 500); }
    else { alert(`デイリー全クリア！\n連続達成: ${streakCount}日目です！`); }
    saveGameData();
    const streakDisp = document.getElementById("streakDisplay");
    if(streakDisp) streakDisp.innerText = `連続 ${streakCount}日目`;
}

function claimReward(itemKey) {
    if (!inventory[itemKey]) inventory[itemKey] = 0;
    inventory[itemKey]++;
    streakCount = 0;
    document.getElementById("rewardSelectModal").style.display = "none";
    alert("アイテムを「REWARD BOX」に追加しました！");
    const streakDisp = document.getElementById("streakDisplay");
    if(streakDisp) streakDisp.innerText = `連続 ${streakCount}日目`;
    saveGameData();
}

function openInventoryModal() {
    const container = document.getElementById("inventoryContainer");
    const names = { ticket500: "🎟 500円引換補助券", gameTime: "🎮 ゲーム30分延長", bathPass: "🛁 お風呂掃除パス" };
    let html = ""; let hasItem = false;
    for (let key in inventory) {
        if (inventory[key] > 0) {
            hasItem = true;
            html += `<div class="inventory-item"><span>${names[key] || key}</span><span><span class="inventory-count">x${inventory[key]}</span><button class="use-btn" onclick="useItem('${key}')">使う</button></span></div>`;
        }
    }
    if (!hasItem) html = "<p style='color:#777; text-align:center;'>アイテムを持っていません。</p>";
    container.innerHTML = html;
    document.getElementById("inventoryModal").style.display = "flex";
}

function useItem(key) { if(confirm("使用しますか？")) { inventory[key]--; openInventoryModal(); saveGameData(); alert("使用しました！"); } }
function closeInventoryModal() { document.getElementById("inventoryModal").style.display = "none"; }
function getRequiredXP() { return 100 + (level - 1) * 200; }
function addXP(amount) {
    xp += amount; let required = getRequiredXP();
    while (xp >= required) { xp -= required; level++; alert(`RANK UP! Lv.${level} になりました！`); required = getRequiredXP(); }
    updateStatusUI(); saveGameData();
}
function updateStatusUI() {
    const required = getRequiredXP();
    document.getElementById("levelVal").innerText = level; document.getElementById("xpVal").innerText = xp; document.getElementById("xpMax").innerText = required;
    const percent = Math.min((xp / required) * 100, 100);
    document.getElementById("xpBar").style.width = percent + "%";
}
function renderTasks() {
    const ul = document.getElementById("taskList"); ul.innerHTML = "";
    myTasks.forEach((t, idx) => {
        const li = document.createElement("li"); li.className = "task-item";
        li.innerHTML = `<span onclick="toggleTask(${idx})" style="flex:1; cursor:pointer;">${t.completed ? '✅' : '⬜'} ${t.text}</span><button class="btn-delete" onclick="deleteTask(${idx})">削除 🗑</button>`;
        if (t.completed) li.classList.add("completed"); ul.appendChild(li);
    });
}
function addTask() { const input = document.getElementById("taskInput"); if (!input.value) return; myTasks.push({ text: input.value, completed: false }); input.value = ""; renderTasks(); saveGameData(); }
function deleteTask(idx) { if (confirm("削除しますか？")) { myTasks.splice(idx, 1); renderTasks(); saveGameData(); } }
function toggleTask(idx) {
    myTasks[idx].completed = !myTasks[idx].completed;
    if (myTasks[idx].completed) { totalTasksCompleted++; checkAchievements(); const d2 = myDailyQuests.find(q => q.id === 'd2'); if (d2 && !d2.completed) { d2.completed = true; addXP(d2.xp); renderDaily(); saveGameData(); } } else { totalTasksCompleted--; }
    renderTasks(); saveGameData();
}
function checkAchievements() {
    let newUnlock = false;
    activeAchievements.forEach(ach => { if (!ach.unlocked && ach.condition(myTasks, totalTasksCompleted)) { ach.unlocked = true; newUnlock = true; } });
    if (newUnlock) { const notif = document.getElementById("notification"); notif.style.display = "block"; saveGameData(); setTimeout(() => { notif.style.display = "none"; }, 5000); }
}
function openModal() {
    const container = document.getElementById("achieveContainer"); container.innerHTML = "";
    activeAchievements.forEach(ach => {
        const div = document.createElement("div"); div.className = "achieve-list-item";
        if (ach.unlocked) {
            if (!ach.claimed) { div.style.borderColor = "#ff0055"; div.innerHTML = `🔓 ${ach.text} <span class="new-badge">NEW! Click to GET ${ach.xpReward}XP</span>`; div.onclick = () => { ach.claimed = true; addXP(ach.xpReward); openModal(); }; }
            else { div.style.opacity = "0.6"; div.innerHTML = `🏅 ${ach.text} <span style="float:right; color:#00ff9d;">CLEAR</span>`; }
        } else { div.className += " locked"; div.innerHTML = `🔒 ？？？？？？？？`; }
        container.appendChild(div);
    });
    document.getElementById("achieveModal").style.display = "flex"; document.getElementById("notification").style.display = "none";
}
function closeModal() { document.getElementById("achieveModal").style.display = "none"; }
function renderAll() { updateStatusUI(); renderDaily(); renderTasks(); renderDevQuests(); }