(function(){
  'use strict';

  // ── 激活检测 ─────────────────────────────────────────
  if(!location.hash || !location.hash.includes('debug')) return; // 零代码执行

  // ── 命名空间 ─────────────────────────────────────────
  const _debug = window._debug = {
    version: 'v176-A5',
    ready: false,
    teleportMode: null,    // null | {unitId}
    fastForwardActive: false,
  };

  // ── Toast ────────────────────────────────────────────
  function _dbgToast(msg, duration){
    duration = duration || 2000;
    let t = document.getElementById('_dbg_toast');
    if(!t){
      t = document.createElement('div');
      t.id = '_dbg_toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(function(){ t.style.opacity = '0'; }, duration);
  }
  _debug.toast = _dbgToast;

  // ── 安全调用包装 ─────────────────────────────────────
  function _dbgSafe(fn, label){
    try{
      fn();
      if(typeof renderAll === 'function') renderAll();
      if(typeof invalidateFogCache === 'function') invalidateFogCache();
      if(label) _dbgToast('✓ ' + label);
    }catch(e){
      console.error('[Debug] '+label+':', e);
      _dbgToast('✗ ' + (label||'error') + ': ' + e.message, 4000);
    }
  }
  _debug.safe = _dbgSafe;

  // ── 数值输入解析 ─────────────────────────────────────
  // '' → null（不修改）, '+5000' → {delta:5000}, '-200' → {delta:-200}, '8000' → {set:8000}
  function _dbgParseNum(s){
    if(s == null) return null;
    s = String(s).trim();
    if(!s) return null;
    if(/^[+\-]/.test(s)){
      const n = Number(s);
      if(!Number.isFinite(n)) return null;
      return {delta: n};
    }
    const n = Number(s);
    if(!Number.isFinite(n)) return null;
    return {set: n};
  }
  function _dbgApplyNum(cur, parsed){
    if(!parsed) return cur;
    if(parsed.set != null) return parsed.set;
    if(parsed.delta != null) return (cur || 0) + parsed.delta;
    return cur;
  }

  // ── 等待G就绪 ────────────────────────────────────────
  function _dbgWaitForGame(maxWaitMs, cb){
    const start = Date.now();
    (function poll(){
      if(typeof G !== 'undefined' && G && G.factions && Object.keys(G.factions).length > 0){
        cb(true);
        return;
      }
      if(Date.now() - start > maxWaitMs){
        cb(false);
        return;
      }
      setTimeout(poll, 200);
    })();
  }

  // ── 主初始化 ─────────────────────────────────────────
  function _dbgInit(){
    _dbgBuildUI();
    _dbgRefreshAll();
    // 监听ESC退出modal模式
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape'){
        if(_debug.teleportMode){ _dbgCancelTeleport(); }
      }
    });
    // 选中部队变化时刷新部队section
    setInterval(function(){
      if(!_debug.ready) return;
      const panel = document.getElementById('_dbg_panel');
      if(!panel || !panel.classList.contains('dbg-visible')) return;
      _dbgRefreshUnitSection();
      _dbgRefreshTurnDisplay();
    }, 600);
    _debug.ready = true;
    console.log('[Debug] Panel ready. URL #debug detected. 点击右上角 🔧 DEBUG 展开。');
  }

  document.addEventListener('DOMContentLoaded', function(){
    _dbgWaitForGame(15000, function(ok){
      if(!ok){
        console.error('[Debug] G未在15秒内就绪，Debug面板未启用。请先在标题菜单选择剧本进入游戏。');
        // 加一个重试按钮的角标
        const corner = document.createElement('div');
        corner.id = '_dbg_corner';
        corner.textContent = '🔧 DEBUG (待开局)';
        corner.title = '游戏尚未开始。开始游戏后点此重试。';
        corner.onclick = function(){
          _dbgWaitForGame(2000, function(ok2){
            if(ok2){ corner.remove(); _dbgInit(); }
            else { _dbgToast('游戏仍未就绪', 2000); }
          });
        };
        document.body.appendChild(corner);
        return;
      }
      _dbgInit();
    });
  });

  // ════════════════════════════════════════════════════
  // UI构造
  // ════════════════════════════════════════════════════

  function _dbgBuildUI(){
    // 角标
    const corner = document.createElement('div');
    corner.id = '_dbg_corner';
    corner.textContent = '🔧 DEBUG';
    corner.title = '点击展开/折叠Debug面板';
    corner.onclick = function(){
      const p = document.getElementById('_dbg_panel');
      if(p) p.classList.toggle('dbg-visible');
    };
    document.body.appendChild(corner);

    // 主面板
    const panel = document.createElement('div');
    panel.id = '_dbg_panel';
    panel.innerHTML = ''
      + _dbgSectionHTML('rs', '资源 / 关系', _dbgRSHtml())
      + _dbgSectionHTML('un', '部队操控', '<div id="_dbg_unit_body">'+_dbgUnitHtml()+'</div>')
      + _dbgSectionHTML('ev', '事件触发', _dbgEventHtml())
      + _dbgSectionHTML('tt', '快进 / AI托管', _dbgTimeHtml())
      + _dbgSectionHTML('sv', '存档', _dbgSaveHtml());
    document.body.appendChild(panel);

    // 绑定section展开
    panel.querySelectorAll('.dbg-section-header').forEach(function(h){
      h.addEventListener('click', function(){
        h.parentElement.classList.toggle('dbg-open');
      });
    });

    // 绑定每个section的事件
    _dbgBindRS();
    _dbgBindUnit();
    _dbgBindEvent();
    _dbgBindTime();
    _dbgBindSave();
  }

  function _dbgSectionHTML(id, title, body){
    return '<div class="dbg-section" data-sec="'+id+'">'
      + '<div class="dbg-section-header"><span class="dbg-section-arrow"></span>'+title+'</div>'
      + '<div class="dbg-section-body">'+body+'</div>'
      + '</div>';
  }

  // 势力下拉选项
  function _dbgFacOptions(){
    return ALL_FACS.map(function(f){
      return '<option value="'+f+'">'+(FAC[f]?.name||f)+'</option>';
    }).join('');
  }

  // ════════════════════════════════════════════════════
  // Section: 资源/关系
  // ════════════════════════════════════════════════════

  function _dbgRSHtml(){
    const facOpts = _dbgFacOptions();
    return ''
      + '<div class="dbg-info">输入规则：留空=不改 / 数字=直接设 / +5000 或 -200=增减</div>'
      + '<div class="dbg-row"><span class="dbg-label">势力</span><select class="dbg-select" id="_dbg_rs_fac">'+facOpts+'</select></div>'
      + '<div class="dbg-row"><span class="dbg-label">金</span><input class="dbg-input" id="_dbg_rs_gold"><span class="dbg-label">木</span><input class="dbg-input" id="_dbg_rs_wood"></div>'
      + '<div class="dbg-row"><span class="dbg-label">铁</span><input class="dbg-input" id="_dbg_rs_iron"><span class="dbg-label">马</span><input class="dbg-input" id="_dbg_rs_horse"></div>'
      + '<div class="dbg-row"><span class="dbg-label">信誉</span><input class="dbg-input" id="_dbg_rs_rep"><span class="dbg-label">粮(全城)</span><input class="dbg-input" id="_dbg_rs_food"></div>'
      + '<div class="dbg-row"><button class="dbg-btn" id="_dbg_rs_apply">应用</button>'
      + '<button class="dbg-btn" id="_dbg_rs_max">一键满血(全势力+10000金+5000每城粮)</button></div>'
      + '<div class="dbg-divider"></div>'
      + '<div class="dbg-row"><select class="dbg-select" id="_dbg_rs_a">'+facOpts+'</select>'
      + '<span class="dbg-label">→</span><select class="dbg-select" id="_dbg_rs_b">'+facOpts+'</select></div>'
      + '<div class="dbg-row"><span class="dbg-label">关系</span><select class="dbg-select" id="_dbg_rs_status">'
      + '<option value="enemy">敌对(war)</option>'
      + '<option value="neutral" selected>中立</option>'
      + '<option value="ally">同盟</option>'
      + '<option value="vassal">附庸</option>'
      + '</select><span class="dbg-label">rel</span><input class="dbg-input" id="_dbg_rs_rel" value="50"></div>'
      + '<div class="dbg-row"><button class="dbg-btn" id="_dbg_rs_setrel">应用关系</button></div>'
      + '<div class="dbg-row"><button class="dbg-btn" id="_dbg_rs_warall">所有AI对玩家宣战</button></div>'
      + '<div class="dbg-row"><button class="dbg-btn" id="_dbg_rs_neutral">所有势力中立(rel=30)</button></div>';
  }

  function _dbgBindRS(){
    document.getElementById('_dbg_rs_apply').onclick = function(){
      const fid = document.getElementById('_dbg_rs_fac').value;
      _dbgSafe(function(){
        const fac = G.factions[fid];
        if(!fac || !fac.res) throw new Error('势力'+fid+'不存在');
        const fields = [['gold','金'],['wood','木'],['iron','铁'],['horses','马']];
        const inputIds = {gold:'_dbg_rs_gold', wood:'_dbg_rs_wood', iron:'_dbg_rs_iron', horses:'_dbg_rs_horse'};
        const changed = [];
        fields.forEach(function(p){
          const k = p[0], label = p[1];
          const raw = document.getElementById(inputIds[k]).value;
          const parsed = _dbgParseNum(raw);
          if(parsed){
            fac.res[k] = Math.max(0, Math.floor(_dbgApplyNum(fac.res[k], parsed)));
            changed.push(label);
          }
        });
        // 信誉
        const repRaw = document.getElementById('_dbg_rs_rep').value;
        const repP = _dbgParseNum(repRaw);
        if(repP){
          if(!G.reputation) G.reputation = {};
          G.reputation[fid] = Math.max(0, Math.min(100, _dbgApplyNum(G.reputation[fid]||REPUTATION_DEFAULT, repP)));
          changed.push('信誉');
        }
        // 粮：所有该势力城+N
        const foodRaw = document.getElementById('_dbg_rs_food').value;
        const foodP = _dbgParseNum(foodRaw);
        if(foodP){
          let cnt = 0;
          Object.values(G.cities||{}).forEach(function(c){
            if(c.fac === fid){
              c.storage = Math.max(0, Math.floor(_dbgApplyNum(c.storage||0, foodP)));
              cnt++;
            }
          });
          changed.push('粮('+cnt+'城)');
        }
        if(!changed.length) throw new Error('没有有效输入');
      }, fid+': '+ '已应用');
    };

    document.getElementById('_dbg_rs_max').onclick = function(){
      _dbgSafe(function(){
        ALL_FACS.forEach(function(fid){
          const fac = G.factions[fid];
          if(!fac || !fac.res) return;
          fac.res.gold = (fac.res.gold||0) + 10000;
        });
        Object.values(G.cities||{}).forEach(function(c){
          if(ALL_FACS.includes(c.fac)) c.storage = (c.storage||0) + 5000;
        });
      }, '一键满血');
    };

    document.getElementById('_dbg_rs_setrel').onclick = function(){
      const a = document.getElementById('_dbg_rs_a').value;
      const b = document.getElementById('_dbg_rs_b').value;
      const status = document.getElementById('_dbg_rs_status').value;
      const relP = _dbgParseNum(document.getElementById('_dbg_rs_rel').value);
      const rel = relP ? (relP.set != null ? relP.set : 50) : 50;
      _dbgSafe(function(){
        if(a === b) throw new Error('两势力相同');
        _dbgSetRelation(a, b, status, rel);
      }, FAC[a]?.name+'↔'+FAC[b]?.name+'='+status+'/'+rel);
    };

    document.getElementById('_dbg_rs_warall').onclick = function(){
      _dbgSafe(function(){
        const player = G.playerFac;
        ALL_FACS.forEach(function(f){
          if(f !== player) _dbgSetRelation(f, player, 'enemy', 0);
        });
      }, '所有AI对玩家宣战');
    };

    document.getElementById('_dbg_rs_neutral').onclick = function(){
      _dbgSafe(function(){
        ALL_FACS.forEach(function(a){
          ALL_FACS.forEach(function(b){
            if(a !== b) _dbgSetRelation(a, b, 'neutral', 30);
          });
        });
      }, '全势力中立');
    };
  }

  function _dbgSetRelation(a, b, status, rel){
    const k1 = a+'-'+b, k2 = b+'-'+a;
    if(!G.diplo) G.diplo = {};
    if(!G.diplo[k1]) G.diplo[k1] = {};
    if(!G.diplo[k2]) G.diplo[k2] = {};
    G.diplo[k1].status = status;
    G.diplo[k2].status = status;
    G.diplo[k1].rel = rel;
    G.diplo[k2].rel = rel;
    if(status === 'enemy'){
      G.diplo[k1]._warDeclaredTurn = G.turn;
      G.diplo[k2]._warDeclaredTurn = G.turn;
    }
  }

  // ════════════════════════════════════════════════════
  // Section: 部队操控
  // ════════════════════════════════════════════════════

  function _dbgUnitHtml(){
    const u = _dbgGetSelUnit();
    let selInfo;
    if(!u){
      selInfo = '<div class="dbg-info">请先在地图选中部队(瞬移/编辑用)</div>';
    } else {
      const facName = FAC[u.fac]?.name || u.fac;
      const troops = (u.squads||[]).reduce(function(s,sq){return s+(sq.troops||0);}, 0);
      const maxT = (u.squads||[]).reduce(function(s,sq){return s+(sq.maxTroops||0);}, 0);
      const main = u.squads?.[0]?.genName || '?';
      selInfo = '<div class="dbg-info">选中：<b>'+main+'部</b>('+facName+', '+troops+'/'+maxT+', '+u.status+', AP='+(u._apRemaining||0)+', Lv'+(u.level||1)+')</div>';
    }
    const dis = u ? '' : 'disabled';
    const facOpts = _dbgFacOptions();
    const allUnitOpts = _dbgAllUnitOptions();
    // 守方下拉初始排除第一个unit的fac(避免一开局就出现同势力可选)
    const firstFac = (G.units && G.units[0]) ? G.units[0].fac : null;
    const defOptsInit = _dbgAllUnitOptions(firstFac);
    return ''
      + selInfo
      + '<div class="dbg-row">'
      +   '<button class="dbg-btn" id="_dbg_un_tp" '+dis+'>瞬移</button>'
      +   '<button class="dbg-btn" id="_dbg_un_full" '+dis+'>满编</button>'
      +   '<button class="dbg-btn" id="_dbg_un_ap" '+dis+'>清AP</button>'
      +   '<button class="dbg-btn" id="_dbg_un_hp" '+dis+'>+1000血</button>'
      + '</div>'
      + '<div class="dbg-row">'
      +   '<button class="dbg-btn" id="_dbg_un_exp" '+dis+'>+经验</button>'
      +   '<button class="dbg-btn dbg-danger" id="_dbg_un_del" '+dis+'>删除</button>'
      + '</div>'
      + '<div class="dbg-divider"></div>'
      + '<div class="dbg-info"><b>创建新部队</b></div>'
      + '<div class="dbg-row"><span class="dbg-label">势力</span><select class="dbg-select" id="_dbg_un_fac">'+facOpts+'</select></div>'
      + '<div class="dbg-row"><span class="dbg-label">起始城</span><select class="dbg-select dbg-input dbg-wide" id="_dbg_un_city"></select></div>'
      + '<div class="dbg-row"><span class="dbg-label">武将</span><select class="dbg-select dbg-input dbg-wide" id="_dbg_un_gen"></select></div>'
      + '<div class="dbg-row"><span class="dbg-label">兵力</span><input class="dbg-input" id="_dbg_un_troops" value="5000"><span class="dbg-label">兵种</span><select class="dbg-select" id="_dbg_un_type">'
      + '<option value="cavalry">骑</option><option value="light" selected>轻</option><option value="heavy">重</option><option value="archer">弓</option><option value="siege">攻城</option><option value="naval">水</option>'
      + '</select></div>'
      + '<div class="dbg-row"><button class="dbg-btn" id="_dbg_un_create">创建</button></div>'
      + '<div class="dbg-divider"></div>'
      + '<div class="dbg-info"><b>强制战斗</b>(无视AP/距离/状态/外交)</div>'
      + '<div class="dbg-row"><span class="dbg-label">攻方</span><select class="dbg-select dbg-input dbg-wide" id="_dbg_fb_atk">'+allUnitOpts+'</select></div>'
      + '<div class="dbg-row"><span class="dbg-label">守方</span><select class="dbg-select dbg-input dbg-wide" id="_dbg_fb_def">'+defOptsInit+'</select></div>'
      + '<div class="dbg-row"><span class="dbg-label">类型</span><select class="dbg-select" id="_dbg_fb_kind">'
      +   '<option value="field">野战</option>'
      +   '<option value="ambush">伏击(攻方设伏)</option>'
      +   '<option value="camp">营寨战(守方扎营)</option>'
      +   '<option value="siege">攻城战</option>'
      +   '<option value="naval">水战</option>'
      + '</select></div>'
      + '<div class="dbg-row" id="_dbg_fb_terrain_row"><span class="dbg-label">地形</span><select class="dbg-select" id="_dbg_fb_terrain">'
      +   '<option value="auto">自动(攻方所在)</option>'
      +   '<option value="plain">平原</option>'
      +   '<option value="forest">林地</option>'
      +   '<option value="mountain">山地</option>'
      +   '<option value="hill">丘陵</option>'
      +   '<option value="swamp">沼泽</option>'
      + '</select></div>'
      + '<div class="dbg-row" id="_dbg_fb_mode_row" style="display:none;"><span class="dbg-label">模式</span><select class="dbg-select" id="_dbg_fb_mode">'
      +   '<option value="assault">强攻</option>'
      +   '<option value="raid">劫营(夜袭)</option>'
      + '</select></div>'
      + '<div class="dbg-row" id="_dbg_fb_city_row" style="display:none;"><span class="dbg-label">目标城</span><select class="dbg-select dbg-input dbg-wide" id="_dbg_fb_city"></select></div>'
      + '<div class="dbg-row"><label><input type="checkbox" class="dbg-checkbox" id="_dbg_fb_fire">攻方使用火攻(自动充值资源)</label></div>'
      + '<div class="dbg-row"><button class="dbg-btn" id="_dbg_fb_go">开打</button></div>';
  }

  function _dbgAllUnitOptions(excludeFac){
    if(typeof G === 'undefined' || !G.units) return '<option value="">(无部队)</option>';
    const opts = G.units.filter(function(u){
      return excludeFac ? u.fac !== excludeFac : true;
    }).map(function(u){
      const facName = FAC[u.fac]?.name || u.fac;
      const main = u.squads?.[0]?.genName || '?';
      const troops = (u.squads||[]).reduce(function(s,sq){return s+(sq.troops||0);}, 0);
      return '<option value="'+u.id+'">['+facName+'] '+main+' ('+troops+', '+u.status+')</option>';
    }).join('');
    return opts || '<option value="">(无可选部队)</option>';
  }

  function _dbgGetSelUnit(){
    if(typeof G === 'undefined' || !G.selUnitId) return null;
    return (G.units||[]).find(function(u){ return u.id === G.selUnitId; }) || null;
  }

  function _dbgRefreshUnitSection(){
    const body = document.getElementById('_dbg_unit_body');
    if(!body) return;
    // 仅在选中状态变化时重建,避免破坏正在输入的字段
    const u = _dbgGetSelUnit();
    const lastId = body.dataset.unitId || '';
    const curId = u ? u.id : '';
    if(lastId === curId) return;
    body.innerHTML = _dbgUnitHtml();
    body.dataset.unitId = curId;
    _dbgBindUnit();
  }

  function _dbgRefreshCityOptions(){
    const facSel = document.getElementById('_dbg_un_fac');
    const citySel = document.getElementById('_dbg_un_city');
    if(!facSel || !citySel) return;
    const fid = facSel.value;
    const cities = Object.values(G.cities||{}).filter(function(c){ return c.fac === fid; });
    citySel.innerHTML = cities.map(function(c){
      return '<option value="'+c.id+'">'+(c.name||c.id)+'</option>';
    }).join('') || '<option value="">(无可用城)</option>';
    _dbgRefreshGenOptions();
  }

  function _dbgRefreshGenOptions(){
    const facSel = document.getElementById('_dbg_un_fac');
    const genSel = document.getElementById('_dbg_un_gen');
    if(!facSel || !genSel) return;
    const fid = facSel.value;
    // 已在squad中的武将
    const inSquad = new Set();
    (G.units||[]).forEach(function(u){
      (u.squads||[]).forEach(function(sq){ if(sq.genName) inSquad.add(sq.genName); });
    });
    const gens = (G.generals?.[fid] || []).filter(function(g){
      return g && g.name && !inSquad.has(g.name);
    });
    genSel.innerHTML = gens.map(function(g){
      return '<option value="'+g.name+'">'+g.name+' (战'+g.war+'/统'+g.com+')</option>';
    }).join('') || '<option value="">(无可用武将)</option>';
  }

  function _dbgBindUnit(){
    const tpBtn = document.getElementById('_dbg_un_tp');
    if(tpBtn) tpBtn.onclick = _dbgStartTeleport;
    const fullBtn = document.getElementById('_dbg_un_full');
    if(fullBtn) fullBtn.onclick = function(){
      _dbgSafe(function(){
        const u = _dbgGetSelUnit(); if(!u) throw new Error('无选中');
        (u.squads||[]).forEach(function(sq){ sq.troops = sq.maxTroops || sq.troops; });
      }, '满编');
    };
    const apBtn = document.getElementById('_dbg_un_ap');
    if(apBtn) apBtn.onclick = function(){
      _dbgSafe(function(){
        const u = _dbgGetSelUnit(); if(!u) throw new Error('无选中');
        u._apRemaining = 0;
      }, '清AP');
    };
    const hpBtn = document.getElementById('_dbg_un_hp');
    if(hpBtn) hpBtn.onclick = function(){
      _dbgSafe(function(){
        const u = _dbgGetSelUnit(); if(!u) throw new Error('无选中');
        const sqs = u.squads || [];
        if(!sqs.length) throw new Error('无squad');
        const each = Math.ceil(1000 / sqs.length);
        sqs.forEach(function(sq){
          sq.troops = Math.min(sq.maxTroops || sq.troops + each, (sq.troops||0) + each);
        });
      }, '+1000血');
    };
    const expBtn = document.getElementById('_dbg_un_exp');
    if(expBtn) expBtn.onclick = function(){
      const u = _dbgGetSelUnit(); if(!u){ _dbgToast('无选中'); return; }
      const v = prompt('加多少经验值?', '1000');
      if(v == null) return;
      const n = Number(v);
      if(!Number.isFinite(n) || n <= 0){ _dbgToast('无效数字'); return; }
      _dbgSafe(function(){
        if(typeof addUnitExp === 'function') addUnitExp(u, Math.floor(n));
        else { u.exp = (u.exp||0) + Math.floor(n); }
      }, '+'+Math.floor(n)+'经验');
    };
    const fbBtn = document.getElementById('_dbg_fb_go');
    if(fbBtn) fbBtn.onclick = _dbgForceBattleFromDropdowns;
    // 战斗类型变化时显隐附属字段
    const fbKindSel = document.getElementById('_dbg_fb_kind');
    if(fbKindSel){
      const updateFbFields = function(){
        const k = fbKindSel.value;
        const terrainRow = document.getElementById('_dbg_fb_terrain_row');
        const modeRow = document.getElementById('_dbg_fb_mode_row');
        const cityRow = document.getElementById('_dbg_fb_city_row');
        if(terrainRow) terrainRow.style.display = (k === 'field' || k === 'ambush') ? '' : 'none';
        if(modeRow) modeRow.style.display = (k === 'camp') ? '' : 'none';
        if(cityRow) cityRow.style.display = (k === 'siege') ? '' : 'none';
        if(k === 'siege'){
          const citySel = document.getElementById('_dbg_fb_city');
          const defId = document.getElementById('_dbg_fb_def').value;
          const def = G.units.find(function(u){ return u.id === defId; });
          if(citySel && def){
            const targetFac = def.fac;
            const cities = Object.values(G.cities||{}).filter(function(c){ return c.fac === targetFac; });
            citySel.innerHTML = cities.map(function(c){
              return '<option value="'+c.id+'">'+(c.name||c.id)+' (garrison='+(c.garrison||0)+')</option>';
            }).join('') || '<option value="">(守方无城)</option>';
          }
        }
      };
      fbKindSel.onchange = updateFbFields;
      // 守方变化时,如果选了攻城,刷新城列表
      const fbDefSel = document.getElementById('_dbg_fb_def');
      if(fbDefSel) fbDefSel.onchange = function(){ if(fbKindSel.value === 'siege') updateFbFields(); };
      // 攻方变化时,重建守方下拉(排除同势力)
      const fbAtkSel = document.getElementById('_dbg_fb_atk');
      if(fbAtkSel) fbAtkSel.onchange = function(){
        const atkId = fbAtkSel.value;
        const atk = G.units.find(function(u){ return u.id === atkId; });
        if(!atk || !fbDefSel) return;
        const prevDefId = fbDefSel.value;
        fbDefSel.innerHTML = _dbgAllUnitOptions(atk.fac);
        // 尝试保持原来的守方选择(若它仍在新列表里)
        const stillExists = Array.from(fbDefSel.options).some(function(o){ return o.value === prevDefId; });
        if(stillExists) fbDefSel.value = prevDefId;
        if(fbKindSel.value === 'siege') updateFbFields();
      };
      updateFbFields();
    }
    const delBtn = document.getElementById('_dbg_un_del');
    if(delBtn) delBtn.onclick = function(){
      const u = _dbgGetSelUnit(); if(!u){ _dbgToast('无选中'); return; }
      if(!confirm('确定删除部队 '+(u.squads?.[0]?.genName||'?')+' ?')) return;
      _dbgSafe(function(){
        G.units = G.units.filter(function(x){ return x.id !== u.id; });
        G.selUnitId = null;
      }, '已删除部队');
    };
    // 创建部队
    const createFacSel = document.getElementById('_dbg_un_fac');
    if(createFacSel){
      createFacSel.onchange = _dbgRefreshCityOptions;
      _dbgRefreshCityOptions();
    }
    const createBtn = document.getElementById('_dbg_un_create');
    if(createBtn) createBtn.onclick = function(){
      const fid = document.getElementById('_dbg_un_fac').value;
      const cityId = document.getElementById('_dbg_un_city').value;
      const genName = document.getElementById('_dbg_un_gen').value;
      const troopsRaw = document.getElementById('_dbg_un_troops').value;
      const type = document.getElementById('_dbg_un_type').value;
      const troops = parseInt(troopsRaw, 10);
      if(!cityId){ _dbgToast('请选起始城'); return; }
      if(!genName){ _dbgToast('请选武将'); return; }
      if(!Number.isFinite(troops) || troops <= 0){ _dbgToast('兵力无效'); return; }
      _dbgSafe(function(){
        if(typeof createUnit !== 'function') throw new Error('createUnit不存在');
        const squads = [{genName: genName, type: type, troops: troops, maxTroops: troops, morale: 70}];
        const unit = createUnit({fac: fid, spawnCityId: cityId, squads: squads});
        if(!unit) throw new Error('createUnit返回空');
        G.units.push(unit);
      }, '创建 '+genName+'部 ('+troops+' '+type+')');
    };
  }

  // ── 瞬移 ─────────────────────────────────────────────
  function _dbgStartTeleport(){
    const u = _dbgGetSelUnit(); if(!u){ _dbgToast('无选中'); return; }
    if(_debug.teleportMode){ _dbgCancelTeleport(); return; }
    _debug.teleportMode = {unitId: u.id};
    const btn = document.getElementById('_dbg_un_tp');
    if(btn){ btn.textContent = '取消瞬移'; btn.classList.add('dbg-active'); }
    const map = document.getElementById('mapRoot') || document.getElementById('map') || document.body;
    if(map) map.style.cursor = 'crosshair';
    _dbgToast('点击地图任意hex瞬移此部队 (ESC取消)', 3000);
    // 用capture监听整个document,捕获SVG/Canvas层的click
    document.addEventListener('click', _dbgTeleportClickHandler, true);
  }
  function _dbgCancelTeleport(){
    _debug.teleportMode = null;
    document.removeEventListener('click', _dbgTeleportClickHandler, true);
    const btn = document.getElementById('_dbg_un_tp');
    if(btn){ btn.textContent = '瞬移'; btn.classList.remove('dbg-active'); }
    const map = document.getElementById('mapRoot') || document.getElementById('map') || document.body;
    if(map) map.style.cursor = '';
  }
  function _dbgTeleportClickHandler(e){
    if(!_debug.teleportMode) return;
    // 在面板内点击不算
    if(e.target.closest && e.target.closest('#_dbg_panel')) return;
    if(e.target.closest && e.target.closest('#_dbg_corner')) return;
    // 找hex坐标
    const hex = _dbgPickHexFromEvent(e);
    if(!hex){ _dbgToast('未找到hex位置,请点地图区域'); return; }
    e.stopPropagation(); e.preventDefault();
    const u = (G.units||[]).find(function(x){ return x.id === _debug.teleportMode.unitId; });
    if(!u){ _dbgCancelTeleport(); _dbgToast('部队已不存在'); return; }
    _dbgSafe(function(){
      u.hq = hex.q; u.hr = hex.r;
      // 状态合理化:siege/camp/ambush改为halt
      if(u.status === 'siege' || u.status === 'camp' || u.status === 'ambush'){
        u.status = 'halt';
      }
      // 清掉行军路径
      if(u.hexPath) u.hexPath = [];
      if(u.movePath) u.movePath = [];
    }, '瞬移到 ('+hex.q+','+hex.r+')');
    _dbgCancelTeleport();
  }
  function _dbgPickHexFromEvent(e){
    // 复用游戏自身的 svgEventCoords(处理了 viewBox + _mapTx/_mapTy/_mapScale)
    // 否则 zoom/pan 后坐标会偏。
    if(typeof svgEventCoords === 'function' && typeof pixelToHex === 'function'){
      try{
        const co = svgEventCoords(e);
        if(co && Number.isFinite(co.mx) && Number.isFinite(co.my)){
          const cr = pixelToHex(co.mx, co.my);
          if(cr && cr.col != null && cr.row != null){
            return {q: cr.col, r: cr.row};
          }
        }
      }catch(_){}
    }
    return null;
  }

  // ── 强制战斗(下拉双选,5种类型,脱离游戏选中机制) ──────────
  function _dbgForceBattleFromDropdowns(){
    const atkSel = document.getElementById('_dbg_fb_atk');
    const defSel = document.getElementById('_dbg_fb_def');
    if(!atkSel || !defSel){ _dbgToast('UI未就绪'); return; }
    const atkId = atkSel.value;
    const defId = defSel.value;
    if(!atkId || !defId){ _dbgToast('请选择攻守双方部队'); return; }
    if(atkId === defId){ _dbgToast('攻守不能为同一部队'); return; }
    const atk = G.units.find(function(u){ return u.id === atkId; });
    const def = G.units.find(function(u){ return u.id === defId; });
    if(!atk || !def){ _dbgToast('部队已不存在,请刷新'); return; }
    if(atk.fac === def.fac){ _dbgToast('同势力部队无法战斗'); return; }
    const kind = document.getElementById('_dbg_fb_kind').value;
    const terrain = document.getElementById('_dbg_fb_terrain').value;
    const mode = document.getElementById('_dbg_fb_mode').value;
    const cityId = document.getElementById('_dbg_fb_city').value;
    const useFire = document.getElementById('_dbg_fb_fire').checked;
    const atkName = atk.squads?.[0]?.genName || '?';
    const defName = def.squads?.[0]?.genName || '?';
    const kindLabel = {field:'野战', ambush:'伏击', camp:'营寨战', siege:'攻城战', naval:'水战'}[kind] || kind;
    if(!confirm('让 '+atkName+'部 vs '+defName+'部 进行【'+kindLabel+'】?')) return;
    _dbgRunForceBattle(atk, def, kind, {terrain, mode, cityId, useFire}).catch(function(e){
      console.error('[Debug] forceBattle:', e);
      _dbgToast('战斗失败: '+(e.message||e), 4000);
    });
  }

  // 通用预处理:清行军/状态/AP
  function _dbgPrepUnit(u){
    if(u.hexPath) u.hexPath = [];
    if(u.movePath) u.movePath = [];
    if(u.mobilizingTurns) u.mobilizingTurns = 0;
    u._apRemaining = Math.max(u._apRemaining || 0, 10);
  }

  // 火攻预付费:充资源到刚好够
  function _dbgEnsureFireFunds(fac){
    if(!fac || !fac.res) return;
    if(typeof FIRE_COST === 'undefined') return;
    if((fac.res.gold||0) < FIRE_COST.gold) fac.res.gold = FIRE_COST.gold;
    if((fac.res.wood||0) < FIRE_COST.wood) fac.res.wood = FIRE_COST.wood;
  }

  // BFS找最近river hex(从q,r出发,半径maxR)
  function _dbgFindNearbyRiverHex(q, r, maxR){
    if(typeof HEX_TERRAIN === 'undefined') return null;
    maxR = maxR || 8;
    if(HEX_TERRAIN[hkey(q,r)] === 'river') return {q:q, r:r};
    // 简单同心环搜索
    for(let d=1; d<=maxR; d++){
      for(let dq=-d; dq<=d; dq++){
        for(let dr=-d; dr<=d; dr++){
          if(Math.abs(dq)+Math.abs(dr) < d) continue; // 只看环上
          const nq = q+dq, nr = r+dr;
          if(HEX_TERRAIN[hkey(nq, nr)] === 'river') return {q:nq, r:nr};
        }
      }
    }
    return null;
  }

  // 拍战前位置快照(动画用)
  function _dbgPosSnap(units){
    const snap = {};
    units.forEach(function(u){ snap[u.id] = {hq: u.hq, hr: u.hr}; });
    return snap;
  }

  async function _dbgRunForceBattle(atk, def, kind, opts){
    if(typeof _resolveBattleEngagement !== 'function' && kind === 'field') throw new Error('_resolveBattleEngagement不存在');
    if(typeof renderAll !== 'function') throw new Error('renderAll不存在');

    _dbgPrepUnit(atk);
    _dbgPrepUnit(def);

    if(kind === 'field' || kind === 'naval'){
      // 野战/水战走 _resolveBattleEngagement,但它有2个"玩家方过滤"陷阱:
      //   1) 行29937:守方全AI时会触发retreat避战路径,根本不打 → 没report,没动画
      //   2) _playBattleCollisionAnim 行25767 内联 hasPlayer 检查,不走_baCore.shouldSkip
      // 修法:战斗期间临时把 G.playerFac 改成 def.fac,让"守方是玩家",
      //   既绕过retreat过滤,又让hasPlayer通过。完成后立即恢复。
      if(kind === 'naval'){
        const water = _dbgFindNearbyRiverHex(atk.hq, atk.hr, 12);
        if(!water) throw new Error('攻方附近12格无river hex,无法水战');
        atk.hq = water.q; atk.hr = water.r;
        def.hq = water.q; def.hr = water.r;
      } else {
        def.hq = atk.hq; def.hr = atk.hr;
      }
      atk.status = 'halt'; def.status = 'halt';
      const _origPlayerFac = G.playerFac;
      G.playerFac = def.fac;            // ← 关键
      _dbgRevealAround(atk.hq, atk.hr, 2);  // 揭"现在的"playerFac的雾
      const posSnap = _dbgPosSnap([atk, def]);
      const _brBefore = _battleReports.length;
      const _navalFire = (opts.useFire && kind === 'naval') ? 1 : 0;
      if(_navalFire) _dbgEnsureFireFunds(G.factions[atk.fac]);
      const _origSkip = _dbgOverrideShouldSkip();
      try {
        _resolveBattleEngagement([atk], [def], kind === 'naval' ? '强制水战' : '强制野战', null, _navalFire);
        _dbgRender();
        const newReports = _battleReports.slice(_brBefore);
        const latest = newReports[newReports.length - 1];
        if(latest && latest.isNaval && typeof _playNavalBattleAnim === 'function'){
          await _playNavalBattleAnim(latest, [atk], [def], posSnap);
        } else if(latest && typeof _playBattleCollisionAnim === 'function'){
          await _playBattleCollisionAnim([atk], [def], latest, posSnap);
        }
        // 防御性 drain(AI vs AI水战可能也push到队列了)
        if(typeof _drainPendingBattleAnimations === 'function'){
          try{ await _drainPendingBattleAnimations(); }catch(e){ console.error('[Debug] drain:', e); }
        }
        if(typeof showNextBattleReport === 'function'){
          try{ showNextBattleReport(); }catch(e){ console.error('[Debug] showReport:', e); }
        }
      } finally {
        _dbgRestoreShouldSkip(_origSkip);
        G.playerFac = _origPlayerFac;     // ← 恢复
      }
      return;
    }

    if(kind === 'ambush'){
      if(typeof resolveAmbush !== 'function') throw new Error('resolveAmbush不存在');
      def.hq = atk.hq; def.hr = atk.hr;
      atk.status = 'ambush';
      def.status = 'march';
      _dbgRevealAround(atk.hq, atk.hr, 2);
      const realTerrain = (opts.terrain && opts.terrain !== 'auto') ? opts.terrain : getTerrainAt(atk.hq, atk.hr);
      const posSnap = _dbgPosSnap([atk, def]);
      let useFire = !!opts.useFire;
      if(useFire){
        if(typeof canFireAttack === 'function' && !canFireAttack(realTerrain)){
          useFire = false; _dbgToast('地形'+realTerrain+'不可火攻,已忽略火攻选项', 3000);
        } else {
          _dbgEnsureFireFunds(G.factions[atk.fac]);
        }
      }
      const report = resolveAmbush([atk], [def], realTerrain, useFire);
      report.node = '强制伏击';
      report.atkFac = atk.fac; report.defFac = def.fac;
      report.atkNames = atk.squads.map(function(sq){return sq.genName+'部';}).join('、');
      report.defNames = def.squads.map(function(sq){return sq.genName+'部';}).join('、');
      _battleReports.push(report);
      _pendingBattleAnimations.push({
        kind:'ambush', report:report,
        attackers:[atk], defenders:[def], posSnap:posSnap,
      });
      _dbgRender();
      await _dbgPlayPending();
      return;
    }

    if(kind === 'camp'){
      if(typeof resolveCampBattle !== 'function') throw new Error('resolveCampBattle不存在');
      atk.hq = def.hq; atk.hr = def.hr;
      def.status = 'camp';
      atk.status = 'halt';
      _dbgRevealAround(atk.hq, atk.hr, 2);
      const posSnap = _dbgPosSnap([atk, def]);
      const realMode = opts.mode === 'raid' ? 'raid' : 'assault';
      const realTerrain = getTerrainAt(atk.hq, atk.hr);
      let useFire = !!opts.useFire;
      if(useFire){
        if(typeof canFireAttack === 'function' && !canFireAttack(realTerrain)){
          useFire = false; _dbgToast('地形'+realTerrain+'不可火攻,已忽略火攻选项', 3000);
        } else {
          _dbgEnsureFireFunds(G.factions[atk.fac]);
        }
      }
      const report = resolveCampBattle([atk], [def], realMode, '强制营寨战', useFire);
      report.atkFac = atk.fac; report.defFac = def.fac;
      report.atkNames = atk.squads.map(function(sq){return sq.genName+'部';}).join('、');
      report.defNames = def.squads.map(function(sq){return sq.genName+'部';}).join('、');
      report.node = '强制营寨战';
      _battleReports.push(report);
      _pendingBattleAnimations.push({
        kind:'camp', report:report,
        attackers:[atk], defenders:[def], posSnap:posSnap,
      });
      _dbgRender();
      await _dbgPlayPending();
      return;
    }

    if(kind === 'siege'){
      if(typeof resolveSiegeBattle !== 'function') throw new Error('resolveSiegeBattle不存在');
      const cid = opts.cityId || _dbgGuessCityForUnit(def);
      if(!cid) throw new Error('未指定攻城目标(请选目标城)');
      const city = G.cities?.[cid];
      if(!city) throw new Error('城不存在: '+cid);
      // 守方瞬移进城
      def.hq = city.q; def.hr = city.r; def.status = 'garrison';
      // 攻方:同hex围攻
      atk.hq = city.q; atk.hr = city.r;
      atk.status = 'siege'; atk.siegeTarget = city.id;
      _dbgRevealAround(city.q, city.r, 2);
      const posSnap = _dbgPosSnap([atk, def]);
      const report = resolveSiegeBattle([atk], [def], city, city.name);
      if(!report){ _dbgToast('攻城战返回空(可能无攻方)'); return; }
      report.atkFac = atk.fac; report.defFac = def.fac;
      report.atkNames = atk.squads.map(function(sq){return sq.genName+'部';}).join('、');
      report.defNames = def.squads.map(function(sq){return sq.genName+'部';}).join('、');
      report.node = city.name;
      _battleReports.push(report);
      _pendingBattleAnimations.push({
        kind:'siege', report:report,
        attackers:[atk], defenders:[def], posSnap:posSnap, city:city,
      });
      _dbgRender();
      await _dbgPlayPending();
      return;
    }

    throw new Error('未知战斗类型: '+kind);
  }

  function _dbgRender(){
    if(typeof renderAll === 'function') renderAll();
    if(typeof invalidateFogCache === 'function') invalidateFogCache();
  }

  // shouldSkip override:Debug强制战斗要无视游戏的 AI vs AI / 迷雾 / 玩家不在场 检查。
  // 关键:游戏的 const _baCore 不挂window但与debug script共享global scope,可直接访问。
  function _dbgOverrideShouldSkip(){
    if(typeof _baCore === 'undefined' || !_baCore || typeof _baCore.shouldSkip !== 'function'){
      _debug._lastSkipOverride = false;
      return null;
    }
    const orig = _baCore.shouldSkip;
    _baCore.shouldSkip = function(){ return false; };
    _debug._lastSkipOverride = true;
    return orig;
  }
  function _dbgRestoreShouldSkip(orig){
    if(orig && typeof _baCore !== 'undefined' && _baCore){
      _baCore.shouldSkip = orig;
    }
  }

  // 揭雾:战斗hex及周围radius格设为玩家可见,避免动画在阴影里
  // 不保存原值——揭雾后该格子保持EXPLORED状态(看得见地形/已知历史),
  // 但visible status会在下一次玩家fog重算时根据视野自动恢复。可接受。
  function _dbgRevealAround(q, r, radius){
    if(typeof G === 'undefined' || !G.fog || !G.playerFac) return;
    const fog = G.fog[G.playerFac];
    if(!fog) return;
    if(typeof FOG_VISIBLE === 'undefined') return;
    radius = radius || 2;
    fog[hkey(q, r)] = FOG_VISIBLE;
    if(typeof hexNeighbors === 'function'){
      const queue = [[q, r, 0]];
      const seen = new Set([q+','+r]);
      while(queue.length){
        const [cq, cr, d] = queue.shift();
        if(d >= radius) continue;
        for(const nb of hexNeighbors(cq, cr)){
          const key = nb.col+','+nb.row;
          if(seen.has(key)) continue;
          seen.add(key);
          fog[hkey(nb.col, nb.row)] = FOG_VISIBLE;
          queue.push([nb.col, nb.row, d+1]);
        }
      }
    }
  }

  // 播放队列里的动画 + 弹战报。供 ambush/camp/siege 直调路径用。
  // (field/naval走手动 await `_playBattleCollisionAnim`/`_playNavalBattleAnim`,见上面)
  async function _dbgPlayPending(){
    const _orig = _dbgOverrideShouldSkip();
    try {
      if(typeof _drainPendingBattleAnimations === 'function'){
        try{ await _drainPendingBattleAnimations(); }catch(e){ console.error('[Debug] drain:', e); }
      }
      if(typeof showNextBattleReport === 'function'){
        try{ showNextBattleReport(); }catch(e){ console.error('[Debug] showReport:', e); }
      }
    } finally {
      _dbgRestoreShouldSkip(_orig);
    }
  }

  function _dbgGuessCityForUnit(u){
    if(!u) return null;
    const k = hkey(u.hq||0, u.hr||0);
    return HEX_CITY?.[k] || null;
  }

  // ════════════════════════════════════════════════════
  // Section: 事件触发
  // ════════════════════════════════════════════════════

  function _dbgEventHtml(){
    let opts = '';
    if(typeof EVENT_DEFS !== 'undefined'){
      opts = EVENT_DEFS.map(function(e){
        return '<option value="'+e.id+'">'+(e.icon||'')+' '+(e.name||e.id)+' ('+e.id+')</option>';
      }).join('');
    }
    return ''
      + '<div class="dbg-row"><span class="dbg-label">事件</span><select class="dbg-select dbg-input dbg-wide" id="_dbg_ev_id">'+opts+'</select></div>'
      + '<div class="dbg-row"><span class="dbg-label">势力</span><select class="dbg-select" id="_dbg_ev_fac">'+_dbgFacOptions()+'</select></div>'
      + '<div class="dbg-row"><label><input type="checkbox" class="dbg-checkbox" id="_dbg_ev_luck">强制掷骰(让Math.random几乎必中)</label></div>'
      + '<div class="dbg-row">'
      +   '<button class="dbg-btn" id="_dbg_ev_fire">立即触发</button>'
      +   '<button class="dbg-btn" id="_dbg_ev_diag">试探100次</button>'
      + '</div>'
      + '<div class="dbg-info" id="_dbg_ev_diag_box" style="display:none;background:#0a0a0a;border:1px solid #333;padding:6px;margin-top:4px;white-space:pre-wrap;font-size:10px;max-height:280px;overflow-y:auto;color:#9c9;"></div>';
  }

  // 友好的当前游戏状态(只显示游戏tab能看到的字段)
  function _dbgGameSnapshot(fid){
    const lines = [];
    const seasonNames = ['春','夏','秋','冬'];
    const seasonIdx = G.seasonIdx ?? 0;
    lines.push('第 '+(G.turn||0)+' 旬, '+(seasonNames[seasonIdx % 4]||'?')+'季 (建安'+(G.year||0)+'年)');
    // 各势力存亡
    const facStatus = ALL_FACS.map(function(f){
      const fac = G.factions?.[f];
      const name = FAC[f]?.name || f;
      if(!fac) return name+'(?)';
      return name+(fac._eliminated ? '(亡)' : '(存)');
    }).join(' ');
    lines.push('势力: '+facStatus);
    // 选定势力详情
    const fac = G.factions?.[fid];
    const facName = FAC[fid]?.name || fid;
    if(fac){
      const cityCount = Object.values(G.cities||{}).filter(function(c){ return c.fac === fid; }).length;
      const gens = G.generals?.[fid] || [];
      lines.push('['+facName+'] '+cityCount+'城 / '+(fac.totalTroops|0)+'兵 / '+gens.length+'将');
      lines.push('['+facName+'] 金'+(fac.res?.gold|0)+' 木'+(fac.res?.wood|0)+' 铁'+(fac.res?.iron|0)+' 马'+(fac.res?.horses|0));
      lines.push('['+facName+'] 信誉'+(G.reputation?.[fid]??'?'));
    }
    return lines.join('\n');
  }

  // 试探condition N次,返回成功率统计
  function _dbgProbeCondition(def, fid, n){
    n = n || 100;
    let okCount = 0, errCount = 0;
    const _origRandom = Math.random;
    for(let i=0; i<n; i++){
      try{
        const ctx = def.condition ? def.condition(fid) : null;
        if(ctx) okCount++;
      }catch(_){ errCount++; }
    }
    Math.random = _origRandom;
    // 加测一次"强制掷骰"模式
    let okWithLuck = 0;
    try{
      Math.random = function(){ return 0.001; };
      for(let i=0; i<n; i++){
        try{
          const ctx = def.condition ? def.condition(fid) : null;
          if(ctx) okWithLuck++;
        }catch(_){}
      }
    } finally {
      Math.random = _origRandom;
    }
    return {n: n, ok: okCount, err: errCount, okWithLuck: okWithLuck};
  }

  function _dbgBindEvent(){
    document.getElementById('_dbg_ev_fire').onclick = function(){
      if(typeof EVENT_DEFS === 'undefined'){ _dbgToast('EVENT_DEFS不存在'); return; }
      const id = document.getElementById('_dbg_ev_id').value;
      const fid = document.getElementById('_dbg_ev_fac').value;
      const forceLuck = document.getElementById('_dbg_ev_luck').checked;
      const def = EVENT_DEFS.find(function(e){ return e.id === id; });
      if(!def){ _dbgToast('事件不存在'); return; }
      let ctx = null;
      const _origRandom = Math.random;
      try{
        if(forceLuck){ Math.random = function(){ return 0.001; }; }
        ctx = def.condition ? def.condition(fid) : null;
      } finally {
        Math.random = _origRandom;
      }
      if(!ctx){
        // 触发失败 → 直接展示诊断
        _dbgRenderDiag(def, fid, true);
        return;
      }
      ctx.fid = fid;
      _dbgSafe(function(){
        if(fid === G.playerFac){
          if(typeof _showEventToPlayer !== 'function') throw new Error('_showEventToPlayer不存在');
          _showEventToPlayer({def: def, ctx: ctx});
        } else {
          // AI:走静默处理
          const pers = (typeof AI_PERSONALITY !== 'undefined' && (AI_PERSONALITY[fid] || AI_PERSONALITY.wei)) || {};
          const choices = def.choices(ctx);
          let idx = def.aiChoose ? def.aiChoose(ctx, pers) : 0;
          if(choices[idx]?.disabled) idx = choices.findIndex(function(c){return !c.disabled;});
          if(idx >= 0 && choices[idx]) choices[idx].effect();
        }
      }, '触发 '+def.name+' ('+(FAC[fid]?.name||fid)+')');
    };
    document.getElementById('_dbg_ev_diag').onclick = function(){
      if(typeof EVENT_DEFS === 'undefined'){ _dbgToast('EVENT_DEFS不存在'); return; }
      const id = document.getElementById('_dbg_ev_id').value;
      const fid = document.getElementById('_dbg_ev_fac').value;
      const def = EVENT_DEFS.find(function(e){ return e.id === id; });
      if(!def){ _dbgToast('事件不存在'); return; }
      _dbgRenderDiag(def, fid, false);
    };
    // 切事件/势力时清空诊断框,避免上一个事件的数据混淆
    const evIdSel = document.getElementById('_dbg_ev_id');
    const evFacSel = document.getElementById('_dbg_ev_fac');
    const clearDiag = function(){
      const box = document.getElementById('_dbg_ev_diag_box');
      if(box){ box.textContent = ''; box.style.display = 'none'; }
    };
    if(evIdSel) evIdSel.onchange = clearDiag;
    if(evFacSel) evFacSel.onchange = clearDiag;
  }

  function _dbgRenderDiag(def, fid, isFromFailedFire){
    const box = document.getElementById('_dbg_ev_diag_box');
    if(!box) return;
    const probe = _dbgProbeCondition(def, fid, 100);
    const facName = FAC[fid]?.name || fid;
    let txt = '── '+(def.icon||'')+' '+(def.name||def.id)+' ['+def.id+'] @ '+facName+' ──\n\n';
    if(isFromFailedFire) txt += '❌ 刚才那次触发失败。\n\n';
    // 试探结果
    txt += '【试探100次】\n';
    if(probe.ok === 100){
      txt += '  ✅ 100/100 必中,直接点【立即触发】即可\n';
    } else if(probe.ok === 0 && probe.okWithLuck === 0){
      txt += '  ❌ 0/100 全失败 (即使强制掷骰也不行)\n';
      txt += '  → 硬条件不满足(看下方源码线索,改G状态再试)\n';
    } else if(probe.ok === 0 && probe.okWithLuck > 0){
      txt += '  ⚠ 默认 0/100,强制掷骰下 '+probe.okWithLuck+'/100\n';
      txt += '  → 概率门槛挡住了,勾"强制掷骰"再触发\n';
    } else {
      const pct = (probe.ok).toFixed(0);
      txt += '  ✓ 默认 '+probe.ok+'/100 ('+pct+'%) 成功率\n';
      if(probe.okWithLuck > probe.ok) txt += '  强制掷骰下 '+probe.okWithLuck+'/100\n';
      txt += '  → 直接点【立即触发】通常会成功\n';
    }
    if(probe.err > 0) txt += '  (其中 '+probe.err+' 次抛异常,可能事件代码有bug)\n';
    txt += '\n【当前游戏状态】\n'+_dbgGameSnapshot(fid)+'\n\n';
    txt += '【condition 源码 (展开看硬条件)】\n';
    try{
      const src = def.condition.toString();
      txt += src.length > 2000 ? src.substring(0, 2000)+'\n...(truncated)' : src;
    }catch(_){ txt += '(无法读取源码)'; }
    box.textContent = txt;
    box.style.display = 'block';
  }

  // ════════════════════════════════════════════════════
  // ════════════════════════════════════════════════════
  // Section: 快进 / AI托管(合并:fastForwardTurns 内部 _fastForward=true 让玩家也走 runAI)
  // ════════════════════════════════════════════════════

  function _dbgTimeHtml(){
    return ''
      + '<div class="dbg-info">当前: 第 <b id="_dbg_tt_turn">?</b> 旬</div>'
      + '<div class="dbg-row">'
      +   '<button class="dbg-btn" data-ff="1">+1</button>'
      +   '<button class="dbg-btn" data-ff="5">+5</button>'
      +   '<button class="dbg-btn" data-ff="10">+10</button>'
      +   '<button class="dbg-btn" data-ff="30">+30</button>'
      + '</div>'
      + '<div class="dbg-row"><span class="dbg-label">自定义</span><input class="dbg-input" id="_dbg_tt_n" value="50">'
      + '<button class="dbg-btn" id="_dbg_tt_go">快进</button></div>'
      + '<div class="dbg-info" id="_dbg_tt_status">就绪</div>'
      + '<div class="dbg-info" style="color:#aa6;">注:快进期间玩家势力由AI接管(_fastForward=true 时 runAI 包括玩家),无动画无弹窗。胜利/玩家淘汰时游戏自动中断。</div>';
  }

  function _dbgBindTime(){
    document.querySelectorAll('#_dbg_panel [data-ff]').forEach(function(b){
      b.onclick = function(){ _dbgFastForward(parseInt(b.dataset.ff, 10)); };
    });
    document.getElementById('_dbg_tt_go').onclick = function(){
      const n = parseInt(document.getElementById('_dbg_tt_n').value, 10);
      if(!Number.isFinite(n) || n <= 0){ _dbgToast('无效数字'); return; }
      _dbgFastForward(n);
    };
  }

  async function _dbgFastForward(n){
    if(_debug.fastForwardActive){ _dbgToast('已在快进中'); return; }
    if(typeof fastForwardTurns !== 'function'){ _dbgToast('fastForwardTurns不存在'); return; }
    _debug.fastForwardActive = true;
    const status = document.getElementById('_dbg_tt_status');
    if(status) status.textContent = '快进中… '+n+' 旬';
    try{
      await fastForwardTurns(n);
      if(status) status.textContent = '已完成 +'+n+' 旬';
    } catch(e){
      console.error('[Debug] fastForward:', e);
      if(status) status.textContent = '出错: '+e.message;
    } finally {
      _debug.fastForwardActive = false;
    }
  }

  // 当前旬数显示(给"快进/AI托管"section用)
  function _dbgRefreshTurnDisplay(){
    const turnEl = document.getElementById('_dbg_tt_turn');
    if(turnEl && typeof G !== 'undefined') turnEl.textContent = G.turn || '?';
  }

  // ════════════════════════════════════════════════════
  // Section: 存档
  // ════════════════════════════════════════════════════

  function _dbgSaveHtml(){
    return ''
      + '<div class="dbg-row">'
      +   '<button class="dbg-btn" id="_dbg_sv_export">导出 → 剪贴板</button>'
      +   '<button class="dbg-btn" id="_dbg_sv_import">从剪贴板导入</button>'
      + '</div>'
      + '<div class="dbg-divider"></div>'
      + '<div class="dbg-info"><b>快速槽位</b></div>'
      + _dbgSlotRow(1) + _dbgSlotRow(2) + _dbgSlotRow(3);
  }
  function _dbgSlotRow(n){
    return '<div class="dbg-row" data-slot="'+n+'">'
      + '<span class="dbg-label">Slot '+n+'</span>'
      + '<span class="dbg-info" id="_dbg_sv_label_'+n+'" style="flex:1;">(空)</span>'
      + '<button class="dbg-btn" data-sv="save" data-n="'+n+'">存</button>'
      + '<button class="dbg-btn" data-sv="load" data-n="'+n+'">读</button>'
      + '<button class="dbg-btn dbg-danger" data-sv="del" data-n="'+n+'">删</button>'
      + '</div>';
  }

  function _dbgBindSave(){
    document.getElementById('_dbg_sv_export').onclick = _dbgExportClipboard;
    document.getElementById('_dbg_sv_import').onclick = _dbgImportClipboard;
    document.querySelectorAll('#_dbg_panel [data-sv]').forEach(function(b){
      const op = b.dataset.sv;
      const n = parseInt(b.dataset.n, 10);
      b.onclick = function(){
        if(op === 'save') _dbgSlotSave(n);
        else if(op === 'load') _dbgSlotLoad(n);
        else if(op === 'del') _dbgSlotDelete(n);
      };
    });
    _dbgRefreshSlotLabels();
  }

  function _dbgSlotKey(n){ return '_dbg_slot_'+n; }
  function _dbgSlotMetaKey(n){ return '_dbg_slot_meta_'+n; }

  // localStorage 安全访问(隐私模式/opaque origin等场景下不可用)
  function _dbgLS(){
    try{
      if(typeof localStorage === 'undefined') return null;
      // 探测:某些环境localStorage存在但读写抛错
      localStorage.getItem('_dbg_probe');
      return localStorage;
    }catch(_){ return null; }
  }

  function _dbgSlotSave(n){
    _dbgSafe(function(){
      const ls = _dbgLS();
      if(!ls) throw new Error('localStorage不可用');
      if(typeof _serializeG !== 'function') throw new Error('_serializeG不存在');
      const data = _serializeG(); // string
      const cityCount = Object.values(G.cities||{}).filter(function(c){ return c.fac === G.playerFac; }).length;
      const meta = {
        turn: G.turn,
        fac: G.playerFac,
        facName: FAC[G.playerFac]?.name || G.playerFac,
        cityCount: cityCount,
        savedAt: new Date().toISOString(),
        version: 175,
      };
      ls.setItem(_dbgSlotKey(n), data);
      ls.setItem(_dbgSlotMetaKey(n), JSON.stringify(meta));
      _dbgRefreshSlotLabels();
    }, 'Slot'+n+' 已存');
  }
  function _dbgSlotLoad(n){
    _dbgSafe(function(){
      const ls = _dbgLS();
      if(!ls) throw new Error('localStorage不可用');
      const data = ls.getItem(_dbgSlotKey(n));
      if(!data) throw new Error('槽位为空');
      if(typeof _deserializeG !== 'function') throw new Error('_deserializeG不存在');
      _deserializeG(data);
    }, 'Slot'+n+' 已读');
  }
  function _dbgSlotDelete(n){
    if(!confirm('删除 Slot '+n+' ?')) return;
    const ls = _dbgLS();
    if(ls){
      ls.removeItem(_dbgSlotKey(n));
      ls.removeItem(_dbgSlotMetaKey(n));
    }
    _dbgRefreshSlotLabels();
    _dbgToast('Slot'+n+' 已删');
  }
  function _dbgRefreshSlotLabels(){
    const ls = _dbgLS();
    [1,2,3].forEach(function(n){
      const lbl = document.getElementById('_dbg_sv_label_'+n);
      if(!lbl) return;
      if(!ls){ lbl.textContent = '(localStorage不可用)'; return; }
      const metaStr = ls.getItem(_dbgSlotMetaKey(n));
      if(!metaStr){ lbl.textContent = '(空)'; return; }
      try{
        const m = JSON.parse(metaStr);
        lbl.textContent = '第'+m.turn+'旬 '+m.facName+' '+m.cityCount+'城';
      } catch(_){ lbl.textContent = '(损坏)'; }
    });
  }

  async function _dbgExportClipboard(){
    try{
      if(typeof _serializeG !== 'function') throw new Error('_serializeG不存在');
      const data = _serializeG();
      const wrapped = JSON.stringify({
        version: 175,
        turn: G.turn,
        fac: G.playerFac,
        savedAt: new Date().toISOString(),
        data: data,
      });
      await navigator.clipboard.writeText(wrapped);
      _dbgToast('✓ 已复制到剪贴板 ('+(wrapped.length/1024).toFixed(1)+'KB)');
    } catch(e){
      console.error('[Debug] export:', e);
      _dbgToast('✗ 导出失败: '+e.message, 4000);
    }
  }
  async function _dbgImportClipboard(){
    try{
      const text = await navigator.clipboard.readText();
      if(!text) throw new Error('剪贴板为空');
      const obj = JSON.parse(text);
      if(!obj.data) throw new Error('格式错误:无data字段');
      if(typeof _deserializeG !== 'function') throw new Error('_deserializeG不存在');
      _deserializeG(obj.data);
      if(typeof renderAll === 'function') renderAll();
      if(typeof invalidateFogCache === 'function') invalidateFogCache();
      _dbgToast('✓ 载入: 第'+obj.turn+'旬 '+(FAC[obj.fac]?.name||obj.fac));
    } catch(e){
      console.error('[Debug] import:', e);
      _dbgToast('✗ 导入失败: '+e.message, 4000);
    }
  }

  // ════════════════════════════════════════════════════
  // 全面刷新(初次)
  // ════════════════════════════════════════════════════
  function _dbgRefreshAll(){
    _dbgRefreshSlotLabels();
    _dbgRefreshTurnDisplay();
  }

  // 暴露给控制台调试
  _debug.setRelation = _dbgSetRelation;
  _debug.toast = _dbgToast;
  _debug.safe = _dbgSafe;

})();
