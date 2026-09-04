import { pokedex, starterPool } from './pokedex.js';
import { regions } from './regions.js';
import { animeLegends } from './legends.js';

let currentRegionIndex = 0;
let playerBox = []; 
let playerTeam = []; 
let enemyTeam = [];
let maxTeamSize = 3; 

let activeP1 = 0, activeP2 = 0;
let isWildEncounter = false;
let isCasualBattle = false;
let isEliteFourBattle = false;
let isLegendBattle = false;
let zMoveUsed = false, zMoveActiveForTurn = false, megaUsed = false;
let currentDraftPkmn = "", currentMoves = [];

let battleActionLocked = false;
let wildEncounterEnded = false;

function saveGame() {
    const saveData = {
        currentRegionIndex,
        playerBox,
        regions: regions.map(r => ({
            name: r.name,
            unlocked: r.unlocked,
            gyms: r.gyms.map(g => ({ name: g.name, defeated: g.defeated }))
        }))
    };
    localStorage.setItem('pokemonProductionSave', JSON.stringify(saveData));
}

function loadGame() {
    const saved = localStorage.getItem('pokemonProductionSave');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            currentRegionIndex = data.currentRegionIndex || 0;
            playerBox = data.playerBox || [];
            if (data.regions) {
                data.regions.forEach((sr, idx) => {
                    if (regions[idx]) {
                        regions[idx].unlocked = sr.unlocked;
                        sr.gyms.forEach((sg, gIdx) => {
                            if (regions[idx].gyms[gIdx]) {
                                regions[idx].gyms[gIdx].defeated = sg.defeated;
                            }
                        });
                    }
                });
            }
            return true;
        } catch (e) {
            console.error("Failed to load save", e);
        }
    }
    return false;
}

function logToScreen(message) {
    const logBox = document.getElementById('battle-log');
    if (logBox) {
        logBox.innerHTML += `> ${message}<br>`;
        logBox.scrollTop = logBox.scrollHeight;
    }
}

function initGame() {
    const hasSave = loadGame();
    if (hasSave && playerBox.length > 0) {
        document.getElementById('starter-screen').style.display = 'none';
        loadMap();
        return;
    }

    const sList = document.getElementById('starter-list');
    if (!sList) return;
    sList.innerHTML = "";
    starterPool.forEach(pkmn => {
        let btn = document.createElement('button');
        btn.innerText = pkmn; 
        btn.className = "btn gym";
        btn.onclick = () => {
            playerBox.push(pkmn); 
            saveGame();
            document.getElementById('starter-screen').style.display = 'none';
            loadMap();
        };
        sList.appendChild(btn);
    });
}

function loadMap() {
    document.getElementById('map-screen').style.display = 'block';
    document.getElementById('battle-screen').style.display = 'none';
    document.getElementById('draft-screen').style.display = 'none';
    
    let reg = regions[currentRegionIndex];
    document.getElementById('region-title').innerText = `🌍 REGION: ${reg.name.toUpperCase()}`;
    document.getElementById('owned-count').innerText = playerBox.length;

    const gList = document.getElementById('gym-list'); 
    gList.innerHTML = "";
    reg.gyms.forEach((gym, idx) => {
        let btn = document.createElement('button');
        if (gym.defeated) {
            btn.innerText = `✅ Defeated ${gym.name}`;
            btn.style.background = "#27ae60";
            btn.disabled = true;
        } else {
            btn.innerText = `VS Gym Leader ${gym.name} (3v3)`;
            btn.className = playerBox.length >= 3 ? "btn gym" : "btn locked";
            btn.disabled = playerBox.length < 3;
            btn.onclick = () => openDraft(3, gym.team, false, false, idx);
        }
        gList.appendChild(btn);
    });

    let allGymsBeaten = reg.gyms.every(g => g.defeated);
    let e4Btn = document.getElementById('elite-four-btn');
    if (allGymsBeaten) {
        e4Btn.innerText = `🏆 CHALLENGE ${reg.name.toUpperCase()} ELITE 4 (6v6)`;
        e4Btn.className = playerBox.length >= 6 ? "btn gym" : "btn locked";
        e4Btn.style.background = "#f1c40f";
        e4Btn.style.color = "#000";
        e4Btn.disabled = playerBox.length < 6;
        e4Btn.onclick = () => openDraft(6, reg.eliteFour, true, false, -1);
    } else {
        e4Btn.innerText = `🔒 ${reg.name.toUpperCase()} ELITE 4 LOCKED`;
        e4Btn.style.background = "#7f8c8d";
        e4Btn.style.color = "white";
        e4Btn.disabled = true;
    }

    const lList = document.getElementById('legend-list');
    lList.innerHTML = "";
    animeLegends.forEach((legend, lIdx) => {
        let lBtn = document.createElement('button');
        lBtn.innerText = `⚡ Legend: ${legend.name} (6v6)`;
        lBtn.className = playerBox.length >= 6 ? "btn wild" : "btn locked";
        lBtn.disabled = playerBox.length < 6;
        lBtn.onclick = () => openDraft(6, legend.team, false, true, lIdx);
        lList.appendChild(lBtn);
    });

    const rList = document.getElementById('region-select-list');
    rList.innerHTML = "";
    regions.forEach((r, index) => {
        let rBtn = document.createElement('button');
        rBtn.innerText = r.name + (r.unlocked ? "" : " (Locked)");
        rBtn.className = r.unlocked ? "btn gym" : "btn locked";
        rBtn.disabled = !r.unlocked;
        if(index === currentRegionIndex) rBtn.style.border = "3px solid #f1c40f";
        rBtn.onclick = () => { currentRegionIndex = index; loadMap(); };
        rList.appendChild(rBtn);
    });
}

function openDraft(size, enemyArr, isE4, isLeg, indexRef) {
    maxTeamSize = size; playerTeam = []; enemyTeam = [];
    isEliteFourBattle = isE4;
    isLegendBattle = isLeg;
    isCasualBattle = false;

    enemyArr.forEach(name => {
        let d = pokedex[name] || pokedex["Venusaur"];
        enemyTeam.push({ name: name, id: d.id, type: d.type, hp: d.hp, maxHp: d.hp, moves: Object.keys(d.moves).slice(0,4) });
    });

    document.getElementById('map-screen').style.display = 'none';
    document.getElementById('draft-screen').style.display = 'block';
    document.getElementById('draft-max').innerText = maxTeamSize;
    window.activeRefIndex = indexRef;

    const rGrid = document.getElementById('roster-grid'); rGrid.innerHTML = "";
    playerBox.forEach(pkmn => {
        let btn = document.createElement('button'); btn.innerText = pkmn;
        btn.className = "btn gym"; btn.onclick = () => showMoves(pkmn);
        rGrid.appendChild(btn);
    });
}

window.startCasualBattle = function(size) {
    maxTeamSize = size; playerTeam = []; enemyTeam = [];
    isEliteFourBattle = false;
    isLegendBattle = false;
    isCasualBattle = true;
    isWildEncounter = false;

    let allKeys = Object.keys(pokedex);
    for(let i=0; i<size; i++) {
        let randName = allKeys[Math.floor(Math.random() * allKeys.length)];
        let d = pokedex[randName];
        enemyTeam.push({ name: randName, id: d.id, type: d.type, hp: d.hp, maxHp: d.hp, moves: Object.keys(d.moves).slice(0,4) });
    }

    document.getElementById('map-screen').style.display = 'none';
    document.getElementById('draft-screen').style.display = 'block';
    document.getElementById('draft-max').innerText = maxTeamSize;

    const rGrid = document.getElementById('roster-grid'); rGrid.innerHTML = "";
    playerBox.forEach(pkmn => {
        let btn = document.createElement('button'); btn.innerText = pkmn;
        btn.className = "btn gym"; btn.onclick = () => showMoves(pkmn);
        rGrid.appendChild(btn);
    });
}

function showMoves(pkmn) {
    currentDraftPkmn = pkmn; currentMoves = [];
    document.getElementById('move-selection-box').style.display = 'block';
    const mGrid = document.getElementById('move-grid'); mGrid.innerHTML = "";
    Object.keys(pokedex[pkmn].moves).forEach(m => {
        let btn = document.createElement('button'); btn.innerText = m;
        btn.className = "btn locked";
        btn.onclick = () => {
            if(currentMoves.includes(m)) { currentMoves = currentMoves.filter(x=>x!==m); btn.className = "btn locked"; }
            else if(currentMoves.length < 4) { currentMoves.push(m); btn.className = "btn atk"; }
        };
        mGrid.appendChild(btn);
    });
}

window.confirmPokemonDraft = function() {
    if(currentMoves.length !== 4) return alert("Select exactly 4 moves!");
    let d = pokedex[currentDraftPkmn];
    playerTeam.push({ name: currentDraftPkmn, baseName: currentDraftPkmn, id: d.id, type: d.type, hp: d.hp, maxHp: d.hp, moves: currentMoves, canMega: d.mega });
    document.getElementById('move-selection-box').style.display = 'none';
    
    if(playerTeam.length === maxTeamSize) startBattle();
}

window.startWildEncounter = function() {
    isWildEncounter = true;
    isCasualBattle = false;
    isEliteFourBattle = false;
    isLegendBattle = false;
    wildEncounterEnded = false;
    battleActionLocked = false;

    playerTeam = [];
    enemyTeam = [];
    activeP1 = 0;
    activeP2 = 0;

    let boxTeamSize = Math.min(3, playerBox.length);
    for(let i=0; i<boxTeamSize; i++) {
        let pName = playerBox[i];
        let p = pokedex[pName];
        playerTeam.push({
            name: pName,
            baseName: pName,
            id: p.id,
            type: p.type,
            hp: p.hp,
            maxHp: p.hp,
            moves: Object.keys(p.moves).slice(0, 4),
            canMega: p.mega
        });
    }

    const allP = Object.keys(pokedex);
    const wild = allP[Math.floor(Math.random() * allP.length)];
    const e = pokedex[wild];

    enemyTeam.push({
        name: wild,
        baseName: wild,
        id: e.id,
        type: e.type,
        hp: e.hp,
        maxHp: e.hp,
        moves: Object.keys(e.moves).slice(0, 4),
        canMega: e.mega
    });

    startBattle();
}

function startBattle() {
    document.getElementById('map-screen').style.display = 'none';
    document.getElementById('draft-screen').style.display = 'none';
    document.getElementById('battle-screen').style.display = 'block';

    activeP1 = 0;
    activeP2 = 0;

    zMoveUsed = false;
    megaUsed = false;
    zMoveActiveForTurn = false;
    battleActionLocked = false;

    logToScreen("<strong>Battle Started!</strong>");
    loadActiveFighters();
}

function loadActiveFighters() {
    const p1 = playerTeam[activeP1];
    const p2 = enemyTeam[activeP2];

    if (!p1 || !p2) return;

    document.getElementById('player-name').innerText = p1.name;
    document.getElementById('enemy-name').innerText = p2.name;

    document.getElementById('player-sprite').src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/${p1.id}.gif`;
    document.getElementById('enemy-sprite').src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${p2.id}.gif`;

    document.getElementById('player-remaining').innerText = playerTeam.length - activeP1;
    document.getElementById('enemy-remaining').innerText = enemyTeam.length - activeP2;

    buildActionMenu(p1);
    updateHPBars();
}

function buildActionMenu(p1) {
    const menu = document.getElementById('action-menu'); 
    menu.innerHTML = "";
    
    p1.moves.forEach(m => {
        let btn = document.createElement('button'); 
        btn.innerText = m; 
        btn.className = zMoveActiveForTurn ? "btn tactical" : "btn atk"; 
        if (zMoveActiveForTurn) btn.style.background = "#f1c40f";
        
        btn.onclick = () => {
            if (battleActionLocked) return;
            executeTurn(m);
        };
        menu.appendChild(btn);
    });
    
    if(playerTeam.length > 1) {
        let swBtn = document.createElement('button'); 
        swBtn.innerText = "🔄 SWITCH"; 
        swBtn.className = "btn tactical";
        swBtn.onclick = () => {
            if (battleActionLocked) return;
            openSwitchMenu();
        }; 
        menu.appendChild(swBtn);
    }
    
    if(p1.canMega && !megaUsed) {
        let mgBtn = document.createElement('button'); 
        mgBtn.innerText = "🧬 MEGA"; 
        mgBtn.className = "btn tactical";
        mgBtn.onclick = () => { 
            if (battleActionLocked) return;
            megaUsed = true; 
            p1.name = p1.canMega; 
            p1.maxHp += 30; 
            p1.hp += 30; 
            logToScreen(`🧬 Mega Evolved into ${p1.name}!`); 
            buildActionMenu(p1); 
        };
        menu.appendChild(mgBtn);
    }
    
    if(!zMoveUsed) {
        let zBtn = document.createElement('button'); 
        zBtn.innerText = "💎 Z-MOVE"; 
        zBtn.className = "btn tactical";
        zBtn.onclick = () => { 
            if (battleActionLocked) return;
            zMoveUsed = true; 
            zMoveActiveForTurn = true; 
            logToScreen("💎 Z-Power Activated! Choose your attack!"); 
            buildActionMenu(p1); 
        };
        menu.appendChild(zBtn);
    }

    if (isWildEncounter && !wildEncounterEnded) {
        const catchBtn = document.createElement('button');
        catchBtn.innerText = "🔴 CATCH";
        catchBtn.className = "btn tactical";
        catchBtn.style.background = "#e74c3c";

        catchBtn.onclick = () => {
            if (battleActionLocked) return;
            attemptCatch();
        };
        menu.appendChild(catchBtn);

        const runBtn = document.createElement('button');
        runBtn.innerText = "🏃 RUN";
        runBtn.className = "btn tactical";
        runBtn.style.background = "#7f8c8d";

        runBtn.onclick = () => {
            if (battleActionLocked) return;
            runFromWildBattle();
        };
        menu.appendChild(runBtn);
    }
}

function updateHPBars() {
    let p1 = playerTeam[activeP1], p2 = enemyTeam[activeP2];
    document.getElementById('player-health').style.width = Math.max(0, (p1.hp/p1.maxHp)*100) + '%';
    document.getElementById('enemy-health').style.width = Math.max(0, (p2.hp/p2.maxHp)*100) + '%';
}

function attemptCatch() {
    if (!isWildEncounter || wildEncounterEnded || battleActionLocked) return;

    const p2 = enemyTeam[activeP2];
    if (!p2 || p2.hp <= 0) {
        logToScreen("Cannot catch a fainted Pokémon!");
        return;
    }

    battleActionLocked = true;
    const hpRatio = p2.hp / p2.maxHp;
    const catchRate = Math.min(100, Math.max(35, 35 + ((1 - hpRatio) * 65)));
    const roll = Math.random() * 100;
    
    document.getElementById('action-menu').innerHTML = "";
    logToScreen(`🔴 Threw a Poké Ball! (Chance: ${Math.floor(catchRate)}%)`);

    setTimeout(() => {
        if (wildEncounterEnded || !isWildEncounter) return;

        if (roll <= catchRate) {
            wildEncounterEnded = true;
            logToScreen(`<b>🎉 Gotcha! ${p2.name} was caught!</b>`);
            const caughtName = p2.baseName || p2.name;
            if (!playerBox.includes(caughtName)) playerBox.push(caughtName);
            saveGame();

            logToScreen(`<b>${caughtName} was added to your Pokédex!</b>`);
            setTimeout(() => endWildEncounter(), 1200);
        } else {
            logToScreen("😱 Oh no! It broke free!");
            setTimeout(() => {
                if (wildEncounterEnded || !isWildEncounter) return;
                battleActionLocked = false;
                enemyRetaliates();
            }, 500);
        }
    }, 1000);
}

function runFromWildBattle() {
    if (!isWildEncounter || wildEncounterEnded || battleActionLocked) return;

    battleActionLocked = true;
    wildEncounterEnded = true;
    const menu = document.getElementById('action-menu');
    if (menu) menu.innerHTML = "";

    logToScreen("<b>🏃 You got away safely!</b>");
    setTimeout(() => endWildEncounter(), 1000);
}

function endWildEncounter() {
    isWildEncounter = false;
    wildEncounterEnded = false;
    battleActionLocked = false;
    playerTeam = []; enemyTeam = [];
    activeP1 = 0; activeP2 = 0;
    loadMap();
}

function openSwitchMenu() {
    const menu = document.getElementById('action-menu'); 
    menu.innerHTML = "";
    playerTeam.forEach((p, i) => {
        if(i !== activeP1 && p.hp > 0) {
            let btn = document.createElement('button'); 
            btn.innerText = `${p.name} (${p.hp} HP)`; 
            btn.className = "btn gym";
            btn.onclick = () => { 
                if (battleActionLocked) return;
                activeP1 = i; 
                logToScreen(`Go! ${p.name}!`); 
                loadActiveFighters(); 
                enemyRetaliates(); 
            };
            menu.appendChild(btn);
        }
    });
}

function executeTurn(move) {
    if (battleActionLocked) return;
    battleActionLocked = true;

    let p1 = playerTeam[activeP1], p2 = enemyTeam[activeP2];
    let baseName = p1.baseName;
    let dmg = pokedex[baseName].moves[move] || 30; 
    
    if (zMoveActiveForTurn) {
        dmg *= 2; 
        zMoveActiveForTurn = false; 
        logToScreen(`<b>🔥 UNLEASHED Z-POWER DAMAGE! 🔥</b>`);
    }
    
    p2.hp -= Math.floor(dmg); 
    if (p2.hp < 0) p2.hp = 0;

    updateHPBars();
    logToScreen(`<b>${p1.name}</b> used ${move}!`);
    document.getElementById('action-menu').innerHTML = ""; 
    
    if(p2.hp <= 0) {
        logToScreen(`<b>Enemy fainted!</b>`);
        activeP2++;
        setTimeout(() => {
            if(activeP2 >= enemyTeam.length) {
                alert("You won the battle!");
                
                if (isEliteFourBattle) {
                    alert(`🏆 CONGRATULATIONS! You cleared the ${regions[currentRegionIndex].name} Elite 4! Next Region Unlocked!`);
                    if (currentRegionIndex + 1 < regions.length) {
                        regions[currentRegionIndex + 1].unlocked = true;
                        currentRegionIndex++;
                    }
                } else if (!isWildEncounter && !isCasualBattle && !isLegendBattle && window.activeRefIndex !== -1) {
                    regions[currentRegionIndex].gyms[window.activeRefIndex].defeated = true;
                }

                saveGame();
                isWildEncounter = false;
                isCasualBattle = false;
                isEliteFourBattle = false;
                isLegendBattle = false;
                wildEncounterEnded = false;
                battleActionLocked = false;
                loadMap();
            } else { 
                battleActionLocked = false;
                loadActiveFighters(); 
            }
        }, 1500);
        return;
    }
    
    enemyRetaliates();
}

function enemyRetaliates() {
    setTimeout(() => {
        if (!isWildEncounter && wildEncounterEnded) return;

        if (activeP2 >= enemyTeam.length) {
            battleActionLocked = false;
            return;
        }

        let p1 = playerTeam[activeP1], p2 = enemyTeam[activeP2];
        if (!p1 || !p2 || p2.hp <= 0) {
            battleActionLocked = false;
            return;
        }

        let eMove = p2.moves[Math.floor(Math.random() * p2.moves.length)];
        let baseName = pokedex[p2.name] ? p2.name : p2.name.replace("Mega ", "");
        let enemyDmg = pokedex[baseName] && pokedex[baseName].moves[eMove] ? pokedex[baseName].moves[eMove] : 25; 
        
        p1.hp -= enemyDmg; 
        if (p1.hp < 0) p1.hp = 0;

        updateHPBars();
        logToScreen(`Enemy <b>${p2.name}</b> used ${eMove}!`);
        
        if(p1.hp <= 0) {
            logToScreen(`<b>Your Pokémon fainted!</b>`);
            activeP1++;
            setTimeout(() => {
                if(activeP1 >= playerTeam.length) { 
                    alert("You blacked out!"); 
                    isWildEncounter = false;
                    isCasualBattle = false;
                    isEliteFourBattle = false;
                    isLegendBattle = false;
                    wildEncounterEnded = false;
                    battleActionLocked = false;
                    loadMap(); 
                } else { 
                    battleActionLocked = false;
                    loadActiveFighters(); 
                }
            }, 1000);
        } else {
            battleActionLocked = false;
            buildActionMenu(p1); 
        }
    }, 1000);
}

document.getElementById('wild-btn')?.addEventListener('click', startWildEncounter);
document.getElementById('casual-3-btn')?.addEventListener('click', () => startCasualBattle(3));
document.getElementById('casual-6-btn')?.addEventListener('click', () => startCasualBattle(6));
document.getElementById('confirm-moves-btn')?.addEventListener('click', confirmPokemonDraft);

initGame();
