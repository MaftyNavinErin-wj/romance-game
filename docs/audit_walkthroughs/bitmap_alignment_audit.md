# Bitmap Alignment Audit

Bitmap: assets/maps/china-ink-base-v1-hd.png (3344x1882)
SVG image transform: rendered=1360.0x765.4, offset=0.0,-12.2, scale=0.40670

Color classifier is heuristic. Use this as a visual-alignment prompt, not a hard correctness test.

## Review Verdict
- City center review: COMPLETE. Current city hexes are kept; `tools/audit_city_terrain_roads.js` has PASS hard checks for blocked centers, final road hexes, spacing, and terrain-tag heuristics.
- Terrain mismatch review: COMPLETE for base polygons. Listed rows are visual classifier prompts only; impassable/gameplay blocking is covered by the city/terrain/road hard checks.
- River bitmap conflict review: COMPLETE. Final `river` hexes over bitmap mountain are a hard conflict and currently PASS; hill rows are retained as low-confidence visual prompts only.
- Road bitmap review: COMPLETE. Rough-looking southern/western road samples are accepted as visible hill/mountain texture; final road hex legality is covered by hard-water and blocked-road hard checks.
- Gameplay-water review: COMPLETE. Rivers are visual/passable terrain prompts, while hard water is audited separately.

## City Bitmap Hard Conflicts

City centers over bitmap mountain/water are treated as hard visual-placement conflicts.
- PASS

## City Bitmap Soft Prompts

Hill texture or mountain-tag/plain-texture city centers are review prompts, not automatic defects.
- nanyang: q44,r31, data=plain, bitmap=hill, rgb=189.1,175.7,153.7
- xuzhou: q66,r26, data=hill, bitmap=hill, rgb=188.3,177.3,155.1
- luoyang: q40,r20, data=plain, bitmap=hill, rgb=207.9,193.2,168.6
- tianshui: q19,r24, data=mountain, bitmap=plain, rgb=218.1,205.2,180.1
- changan: q31,r22, data=plain, bitmap=hill, rgb=202.9,192.8,172.9
- chengdu: q20,r40, data=plain, bitmap=hill, rgb=167.1,153.8,128.7
- jingzhou: q47,r40, data=plain, bitmap=hill, rgb=176.8,164.3,142.8
- yiling: q38,r38, data=mountain, bitmap=plain, rgb=210.2,197.1,171.7
- shouchun: q63,r28, data=hill, bitmap=hill, rgb=193.5,180.4,152.4
- jianning: q16,r52, data=mountain, bitmap=plain, rgb=210.6,195.6,171.4
- changsha: q56,r49, data=hill, bitmap=hill, rgb=197.8,183.9,161.7
- yuzhang: q66,r50, data=plain, bitmap=hill, rgb=177.9,170.6,139.4
- xiapi: q72,r28, data=plain, bitmap=hill, rgb=166.6,154.8,125.7
- luocheng: q21,r38, data=plain, bitmap=hill, rgb=208.7,194.6,164.7
- lujiang: q66,r35, data=plain, bitmap=hill, rgb=177.4,165.1,138.1
- donghai: q82,r27, data=plain, bitmap=hill, rgb=174.2,166.2,132.4
- langya: q75,r20, data=plain, bitmap=hill, rgb=199.6,185.6,157.2

## City Candidate Suggestions
- nanyang: current=q44,r31; q44,r29:plain,move=21; q42,r33:plain,move=27; q46,r33:plain,move=27; q47,r30:plain,move=27
- xuzhou: current=q66,r26; q66,r25:plain,move=10; q67,r26:plain,move=10; q68,r25:plain,move=21; q64,r24:plain,move=27
- luoyang: current=q40,r20; q39,r20:plain,move=10; q40,r21:plain,move=10; q41,r20:plain,move=10; q38,r20:plain,move=18
- tianshui: current=q19,r24; q17,r24:hill,move=18; q19,r26:hill,move=21; q17,r27:hill,move=36; q21,r27:hill,move=36
- changan: current=q31,r22; q30,r22:plain,move=10; q30,r23:plain,move=10; q31,r21:plain,move=10; q31,r23:plain,move=10
- chengdu: current=q20,r40; q19,r38:plain,move=18; q20,r38:plain,move=21; q19,r37:plain,move=27; q21,r37:plain,move=27
- jingzhou: current=q47,r40; q47,r40:hill,move=0; q46,r40:hill,move=10; q46,r41:hill,move=10; q47,r41:hill,move=10
- yiling: current=q38,r38; q37,r37:hill,move=10; q38,r37:hill,move=10; q38,r39:hill,move=10; q39,r37:hill,move=10
- shouchun: current=q63,r28; q64,r28:plain,move=10; q65,r28:plain,move=18; q61,r29:plain,move=21; q61,r26:plain,move=27
- jianning: current=q16,r52; q15,r51:hill,move=10; q17,r51:hill,move=10; q14,r51:hill,move=21; q18,r51:hill,move=21
- changsha: current=q56,r49; q56,r47:plain,move=21; q55,r46:plain,move=27; q55,r52:plain,move=37; q56,r49:hill,move=0
- yuzhang: current=q66,r50; q68,r52:plain,move=27; q66,r50:hill,move=0; q65,r49:hill,move=10; q65,r50:hill,move=10
- xiapi: current=q72,r28; q72,r28:hill,move=0; q71,r28:hill,move=10; q72,r27:hill,move=10; q73,r27:hill,move=10
- luocheng: current=q21,r38; q20,r38:plain,move=10; q21,r37:plain,move=10; q19,r38:plain,move=18; q20,r37:plain,move=18
- lujiang: current=q66,r35; q67,r36:plain,move=18; q66,r37:plain,move=21; q68,r34:plain,move=21; q69,r35:plain,move=27
- donghai: current=q82,r27; q82,r25:plain,move=21; q82,r30:plain,move=31; q78,r27:plain,move=36; q78,r26:plain,move=37
- langya: current=q75,r20; q75,r22:plain,move=21; q72,r19:plain,move=31; q78,r22:plain,move=31; q73,r17:plain,move=36

## Non-Plain Terrain Mismatch Prompts

Impassable masks are excluded here because border/gameplay blocking is audited separately by the hard checks.
- q34,42: data=forest, bitmap=mountain, rgb=132.7,124.2,105.4
- q36,42: data=forest, bitmap=mountain, rgb=152.8,144,125.1
- q36,44: data=forest, bitmap=mountain, rgb=117.1,110.5,94.4
- q38,40: data=forest, bitmap=hill, rgb=188.2,175.8,152.1
- q38,42: data=forest, bitmap=mountain, rgb=125.5,117.2,99.8
- q38,44: data=forest, bitmap=mountain, rgb=143,132.6,113.2
- q40,42: data=forest, bitmap=mountain, rgb=131.3,120,101.4
- q40,44: data=forest, bitmap=mountain, rgb=121.4,112.6,93.9
- q40,56: data=forest, bitmap=hill, rgb=186.4,171.1,148.8
- q42,14: data=forest, bitmap=hill, rgb=206.6,193.7,169.4
- q42,42: data=forest, bitmap=hill, rgb=159.7,151.3,131.7
- q42,56: data=forest, bitmap=hill, rgb=184.6,172,150.9
- q42,58: data=forest, bitmap=hill, rgb=206.7,192.4,169.5
- q42,60: data=forest, bitmap=hill, rgb=184.4,168.6,142.7
- q44,56: data=forest, bitmap=mountain, rgb=126.6,117.3,99.2
- q44,58: data=forest, bitmap=mountain, rgb=118.5,109,94.4
- q44,60: data=forest, bitmap=mountain, rgb=159.5,145.5,122.8
- q46,56: data=forest, bitmap=mountain, rgb=92,86.6,72.9
- q46,58: data=forest, bitmap=mountain, rgb=128.5,118.7,100.3
- q46,60: data=forest, bitmap=hill, rgb=172.2,159.9,137.9
- q48,58: data=forest, bitmap=mountain, rgb=152.2,140.8,119.5
- q50,60: data=forest, bitmap=hill, rgb=186.9,174.4,152.9
- q50,62: data=forest, bitmap=hill, rgb=185.7,178.4,159.7
- q52,60: data=forest, bitmap=mountain, rgb=134.4,123.3,103.7
- q52,62: data=forest, bitmap=mountain, rgb=152.1,140.4,119.1
- q54,60: data=forest, bitmap=mountain, rgb=150.2,136.7,115.3
- q54,62: data=forest, bitmap=mountain, rgb=143.9,132.4,112.6
- q56,60: data=forest, bitmap=hill, rgb=178.3,162.1,138.6
- q56,62: data=forest, bitmap=mountain, rgb=147.1,136.3,116.3
- q66,58: data=forest, bitmap=mountain, rgb=141.8,134.1,106.4
- q68,58: data=forest, bitmap=hill, rgb=171.8,162.4,137.1
- q70,58: data=forest, bitmap=hill, rgb=190.8,188,171.1
- q88,42: data=forest, bitmap=hill, rgb=183.6,174,141.2
- q88,44: data=forest, bitmap=hill, rgb=168,160.5,138.6
- q90,42: data=forest, bitmap=hill, rgb=158.7,154,132.1
- q90,44: data=forest, bitmap=hill, rgb=205.9,191.8,157.6
- q92,42: data=forest, bitmap=hill, rgb=185.7,175.5,142.9
- q92,44: data=forest, bitmap=mountain, rgb=155.2,148.9,117.5
- q12,16: data=mountain, bitmap=plain, rgb=217.8,203.2,179.3
- q12,22: data=mountain, bitmap=plain, rgb=223.3,210.6,186.8
- q14,18: data=mountain, bitmap=plain, rgb=217.6,201.9,175.7
- q14,22: data=mountain, bitmap=plain, rgb=219.7,206.5,180.5
- q14,24: data=mountain, bitmap=plain, rgb=222.5,208.4,183.2
- q14,52: data=mountain, bitmap=plain, rgb=220.7,207.1,183.4
- q16,22: data=mountain, bitmap=plain, rgb=221.4,208.5,182.7
- q16,24: data=mountain, bitmap=plain, rgb=221.4,208.4,182.1
- q16,48: data=mountain, bitmap=plain, rgb=220.7,206.6,182.7
- q16,50: data=mountain, bitmap=plain, rgb=215.5,198.7,174
- q16,52: data=mountain, bitmap=plain, rgb=210.6,195.6,171.4
- q18,26: data=mountain, bitmap=plain, rgb=221,205.7,179
- q18,52: data=mountain, bitmap=plain, rgb=214.9,200.7,174.7
- q20,26: data=mountain, bitmap=plain, rgb=213.3,198.7,172
- q20,32: data=mountain, bitmap=plain, rgb=213.3,196.6,170.6
- q22,24: data=mountain, bitmap=plain, rgb=217.3,203.3,176.6
- q24,24: data=mountain, bitmap=plain, rgb=223.2,210.3,184.3
- q24,42: data=mountain, bitmap=plain, rgb=219.1,206,179.3
- q26,24: data=mountain, bitmap=plain, rgb=220,207.1,181.5
- q26,52: data=mountain, bitmap=plain, rgb=217.9,205.1,178.9
- q26,54: data=mountain, bitmap=plain, rgb=230.2,217.9,196.4
- q28,24: data=mountain, bitmap=plain, rgb=221.5,207.3,182.2
- q28,52: data=mountain, bitmap=plain, rgb=209.1,194.1,169
- q28,54: data=mountain, bitmap=plain, rgb=228,215.6,194.1
- q30,24: data=mountain, bitmap=plain, rgb=222.5,209.3,184.4
- q30,28: data=mountain, bitmap=plain, rgb=211.7,196.3,168.3
- q30,52: data=mountain, bitmap=plain, rgb=210.3,194.5,168.6
- q30,54: data=mountain, bitmap=plain, rgb=224.6,210.7,184.9
- q32,52: data=mountain, bitmap=plain, rgb=211,195.1,169.1
- q32,54: data=mountain, bitmap=plain, rgb=221.3,208.7,184.1
- q34,54: data=mountain, bitmap=plain, rgb=221.4,207.5,181.5
- q36,36: data=mountain, bitmap=plain, rgb=215.9,201.3,173.8
- q36,38: data=mountain, bitmap=plain, rgb=222.4,209.7,182.8
- q36,8: data=mountain, bitmap=plain, rgb=211.4,196.5,173.3
- q38,10: data=mountain, bitmap=plain, rgb=220.2,206.6,182.2
- q38,12: data=mountain, bitmap=plain, rgb=222.6,208.4,182.8
- q38,38: data=mountain, bitmap=plain, rgb=210.2,197.1,171.7
- q38,8: data=mountain, bitmap=plain, rgb=223.4,210.6,187.1
- q40,10: data=mountain, bitmap=plain, rgb=215.3,203,179
- q40,12: data=mountain, bitmap=plain, rgb=216,202.8,178.6
- q42,6: data=mountain, bitmap=plain, rgb=222,208.6,183.2
- q44,6: data=mountain, bitmap=plain, rgb=224.2,211.7,188.3
- q46,10: data=mountain, bitmap=plain, rgb=226.3,214.6,192.1
- q46,12: data=mountain, bitmap=plain, rgb=226.1,213.3,190.2
- q46,14: data=mountain, bitmap=plain, rgb=204.6,193.6,172
- q46,6: data=mountain, bitmap=plain, rgb=232.9,221.8,202.6
- q48,10: data=mountain, bitmap=plain, rgb=225.9,213.6,190.5
- q48,12: data=mountain, bitmap=plain, rgb=223.9,211.4,187.2
- q48,14: data=mountain, bitmap=plain, rgb=226,212.4,187.6
- q48,6: data=mountain, bitmap=plain, rgb=222.9,209.4,185.4
- q50,6: data=mountain, bitmap=plain, rgb=231,218.8,196.1
- q52,54: data=mountain, bitmap=plain, rgb=210.4,199.9,173.6
- q52,6: data=mountain, bitmap=plain, rgb=230,219.5,198.3
- q54,6: data=mountain, bitmap=plain, rgb=219,206.1,181.7
- q54,8: data=mountain, bitmap=plain, rgb=228.1,215.8,192
- q56,6: data=mountain, bitmap=plain, rgb=216.1,200.9,175.1
- q56,8: data=mountain, bitmap=plain, rgb=229.8,219.2,197
- q58,6: data=mountain, bitmap=plain, rgb=216.1,201.1,176.2
- q58,8: data=mountain, bitmap=plain, rgb=227.6,216.7,193.6
- q6,18: data=mountain, bitmap=plain, rgb=213.4,196.7,171.8
- q60,30: data=mountain, bitmap=plain, rgb=209.6,196.7,171.7
- q60,8: data=mountain, bitmap=plain, rgb=221.4,208.8,184.3
- q62,8: data=mountain, bitmap=plain, rgb=221.8,207.8,180.9
- q64,8: data=mountain, bitmap=plain, rgb=224.1,211.7,187.3
- q66,6: data=mountain, bitmap=plain, rgb=230.4,218.2,195.7
- q66,8: data=mountain, bitmap=plain, rgb=226.5,213.4,190.3
- q68,6: data=mountain, bitmap=plain, rgb=222.3,209.9,185.5
- q68,8: data=mountain, bitmap=plain, rgb=225.5,213.5,188.8
- q70,8: data=mountain, bitmap=plain, rgb=224.5,212.2,189.5
- q72,8: data=mountain, bitmap=plain, rgb=231.2,219.8,198.8
- q68,64: data=water, bitmap=hill, rgb=179.9,170.6,143.9
- q70,62: data=water, bitmap=hill, rgb=172,163.7,144
- q70,64: data=water, bitmap=hill, rgb=168.7,159,130.7
- q70,66: data=water, bitmap=plain, rgb=197.8,194.4,180.7
- q72,64: data=water, bitmap=hill, rgb=161.2,152,122.3
- q72,66: data=water, bitmap=plain, rgb=199.9,196.4,182.6
- q74,64: data=water, bitmap=plain, rgb=199.6,196.4,183.7
- q74,66: data=water, bitmap=plain, rgb=206.9,202.6,189.5
- q76,54: data=water, bitmap=hill, rgb=175.4,168.2,138.1
- q76,56: data=water, bitmap=hill, rgb=162.9,152.3,124.9
- q76,58: data=water, bitmap=hill, rgb=193.3,190.6,178.6
- q76,66: data=water, bitmap=plain, rgb=197.5,194.7,181.5

## River Bitmap Mountain Conflicts

Final `river` hexes are generated after base terrain polygons. A river over bitmap mountain is treated as a hard alignment conflict.
- PASS

## River Bitmap Skip Drift Check

`RIVER_BITMAP_MOUNTAIN_SKIP` should only contain hexes that still sample as bitmap mountain.
- PASS

## River Bitmap Hill Prompts

Hill rows are lower-confidence prompts because they often represent river valleys, foothills, or classifier-darkened wash rather than hard mountain texture.
- q19,33: riverSource=0, bitmap=hill, rgb=195.8,180.2,152
- q19,39: riverSource=8, bitmap=hill, rgb=167.4,154.9,129.8
- q20,33: riverSource=0, bitmap=hill, rgb=192.5,177.6,150.3
- q20,39: riverSource=8, bitmap=hill, rgb=208.6,193.2,163.4
- q21,33: riverSource=0, bitmap=hill, rgb=196.4,182.2,156.5
- q21,38: riverSource=8, bitmap=hill, rgb=208.7,194.6,164.7
- q22,33: riverSource=0, bitmap=hill, rgb=209.1,192.6,165.6
- q22,39: riverSource=8, bitmap=hill, rgb=191.1,178.7,152.1
- q23,32: riverSource=0, bitmap=hill, rgb=177.6,163.9,139.7
- q23,38: riverSource=8, bitmap=hill, rgb=207.5,191.7,161.1
- q24,32: riverSource=2, bitmap=hill, rgb=189.8,173.6,146.6
- q24,38: riverSource=8, bitmap=hill, rgb=204.2,189.8,161.3
- q25,31: riverSource=2, bitmap=hill, rgb=200.5,183.6,156.7
- q25,32: riverSource=0, bitmap=hill, rgb=195.6,182.3,158.1
- q25,38: riverSource=8, bitmap=hill, rgb=202.9,190.1,164
- q26,32: riverSource=0,2, bitmap=hill, rgb=194.9,179.2,151.1
- q26,38: riverSource=8, bitmap=hill, rgb=196.8,184.7,159.9
- q27,31: riverSource=2, bitmap=hill, rgb=190.7,176.4,148.1
- q27,32: riverSource=0, bitmap=hill, rgb=194.6,180.4,154
- q27,38: riverSource=8, bitmap=hill, rgb=169.2,158.1,132.8
- q28,32: riverSource=0,2, bitmap=hill, rgb=184.5,169.3,140.2
- q28,38: riverSource=8, bitmap=hill, rgb=186.1,171.9,146.1
- q29,31: riverSource=0,2, bitmap=hill, rgb=198.8,183,153.2
- q29,37: riverSource=8, bitmap=hill, rgb=188.1,173.3,146.7
- q30,31: riverSource=0, bitmap=hill, rgb=200.2,184.1,156.2
- q30,32: riverSource=2, bitmap=hill, rgb=183.4,168.2,137.8
- q30,38: riverSource=8, bitmap=hill, rgb=173.7,161.5,137.2
- q31,22: riverSource=1, bitmap=hill, rgb=202.9,192.8,172.9
- q31,30: riverSource=0, bitmap=hill, rgb=202.5,186.2,158.2
- q31,31: riverSource=2, bitmap=hill, rgb=198.7,184.5,157.5
- q31,38: riverSource=8, bitmap=hill, rgb=180.1,166.4,141.1
- q32,30: riverSource=0, bitmap=hill, rgb=205.5,189.1,160.8
- q32,32: riverSource=2, bitmap=hill, rgb=201.2,186.7,158.1
- q32,38: riverSource=8, bitmap=hill, rgb=193.1,179.9,154.6
- q33,38: riverSource=3,8, bitmap=hill, rgb=157.6,148.7,129
- q34,29: riverSource=0, bitmap=hill, rgb=198.2,184.5,159.2
- q34,32: riverSource=2, bitmap=hill, rgb=197.4,185.9,162.6
- q34,38: riverSource=3, bitmap=hill, rgb=207.8,193.5,168.1
- q34,39: riverSource=3, bitmap=hill, rgb=173.5,159.5,134.2
- q37,26: riverSource=0, bitmap=hill, rgb=204.9,191.4,167.8
- q38,25: riverSource=0, bitmap=hill, rgb=202.9,187.2,159.3
- q38,26: riverSource=0, bitmap=hill, rgb=192.6,178.3,154.6
- q39,19: riverSource=1, bitmap=hill, rgb=205.7,190.1,165.2
- q39,56: riverSource=9, bitmap=hill, rgb=200.6,187.1,164
- q40,19: riverSource=1, bitmap=hill, rgb=207.1,193.4,169
- q40,24: riverSource=0, bitmap=hill, rgb=190.7,174.8,149.4
- q40,38: riverSource=3, bitmap=hill, rgb=188.5,177.1,153.6
- q40,39: riverSource=3, bitmap=hill, rgb=183.1,168.6,144.6
- q40,57: riverSource=9, bitmap=hill, rgb=197.4,180.4,155.1
- q41,32: riverSource=2, bitmap=hill, rgb=198.8,185.2,161
- q41,38: riverSource=3, bitmap=hill, rgb=174.2,160.6,138.1
- q41,57: riverSource=9, bitmap=hill, rgb=188.1,172.7,147.7
- q42,39: riverSource=3, bitmap=hill, rgb=192.8,176.7,150.2
- q42,57: riverSource=9, bitmap=hill, rgb=180.8,167.1,145
- q42,58: riverSource=9, bitmap=hill, rgb=206.7,192.4,169.5
- q43,39: riverSource=3, bitmap=hill, rgb=160.4,156,138.1
- q43,57: riverSource=9, bitmap=hill, rgb=177.7,163.4,139.2
- q44,33: riverSource=2, bitmap=hill, rgb=195,184,162.4
- q44,39: riverSource=3, bitmap=hill, rgb=187.4,173.6,150
- q45,39: riverSource=3, bitmap=hill, rgb=180,168.1,145.3
- q46,34: riverSource=2, bitmap=hill, rgb=201.8,188.8,162
- q46,35: riverSource=2, bitmap=hill, rgb=192.4,178.8,151.6
- q46,40: riverSource=3, bitmap=hill, rgb=193.5,179,155
- q47,34: riverSource=2, bitmap=hill, rgb=201.2,185.6,158
- q47,35: riverSource=2, bitmap=hill, rgb=197.1,183.8,156.7
- q49,39: riverSource=3, bitmap=hill, rgb=176.9,165.2,141.6
- q49,59: riverSource=9, bitmap=hill, rgb=181.5,169.1,147
- q50,37: riverSource=2, bitmap=hill, rgb=179.8,166.6,140.5
- q50,38: riverSource=2, bitmap=hill, rgb=172.7,160.1,137.8
- q50,55: riverSource=6, bitmap=hill, rgb=174.2,162.8,136.6
- q50,60: riverSource=9, bitmap=hill, rgb=186.9,174.4,152.9
- q51,21: riverSource=0, bitmap=hill, rgb=198.9,189.4,168.8
- q52,21: riverSource=0, bitmap=hill, rgb=204.5,190.1,162.5
- q52,39: riverSource=2, bitmap=hill, rgb=190.7,175.8,150.6
- q52,40: riverSource=2,3, bitmap=hill, rgb=207.3,192.2,167
- q53,20: riverSource=0, bitmap=hill, rgb=193,179.7,154
- q53,40: riverSource=2,3,6, bitmap=hill, rgb=203,189.1,164.7
- q53,51: riverSource=6, bitmap=hill, rgb=179.8,168.5,141.5
- q54,21: riverSource=0, bitmap=hill, rgb=200.2,187.4,160.9
- q54,42: riverSource=6, bitmap=hill, rgb=191.5,179.1,156.5
- q54,43: riverSource=6, bitmap=hill, rgb=171.7,160.9,141.9
- q54,44: riverSource=6, bitmap=hill, rgb=202.2,188,165.2
- q54,51: riverSource=6, bitmap=hill, rgb=177.4,166.1,137.8
- q55,40: riverSource=3, bitmap=hill, rgb=205.2,190.2,163.9
- q55,44: riverSource=6, bitmap=hill, rgb=162.5,152.3,128.2
- q55,45: riverSource=6, bitmap=hill, rgb=174.4,164.1,141.1
- q55,47: riverSource=6, bitmap=hill, rgb=198.4,184.8,160.9
- q55,49: riverSource=6, bitmap=hill, rgb=185.3,172.1,147.9
- q55,59: riverSource=9, bitmap=hill, rgb=164.4,150,126.2
- q56,48: riverSource=6, bitmap=hill, rgb=180.3,169.2,148
- q56,49: riverSource=6, bitmap=hill, rgb=197.8,183.9,161.7
- q56,60: riverSource=9, bitmap=hill, rgb=178.3,162.1,138.6
- q57,19: riverSource=0, bitmap=hill, rgb=183.9,175.2,155.5
- q57,59: riverSource=9, bitmap=hill, rgb=174.5,161.3,138.4
- q58,28: riverSource=7, bitmap=hill, rgb=178.2,168.2,144.7
- q59,28: riverSource=7, bitmap=hill, rgb=204.3,191.1,166
- q60,28: riverSource=7, bitmap=hill, rgb=206.5,193,165.1
- q60,60: riverSource=9, bitmap=hill, rgb=183.7,168.2,147.1
- q61,18: riverSource=0, bitmap=hill, rgb=202.3,190.2,160.4
- q61,28: riverSource=7, bitmap=hill, rgb=203.3,189.7,161.1
- q61,42: riverSource=3,4, bitmap=hill, rgb=194.3,181.3,154.3
- q61,59: riverSource=9, bitmap=hill, rgb=193.9,180.3,157.3
- q62,17: riverSource=0, bitmap=hill, rgb=204.4,192.3,162.2
- q62,18: riverSource=0, bitmap=hill, rgb=204.9,192.2,161.7
- q62,28: riverSource=7, bitmap=hill, rgb=205.6,191.8,161.2
- q62,59: riverSource=9, bitmap=hill, rgb=176.8,169.8,151.9
- q63,16: riverSource=0, bitmap=hill, rgb=174.3,168,148.9
- q63,17: riverSource=0, bitmap=hill, rgb=185.6,176.1,155.2
- q63,28: riverSource=7, bitmap=hill, rgb=193.5,180.4,152.4
- q63,43: riverSource=4, bitmap=hill, rgb=176.4,165.4,140.2
- q63,58: riverSource=9, bitmap=hill, rgb=199.5,185.6,159.6
- q64,44: riverSource=4, bitmap=hill, rgb=165.1,153.8,128.1
- q64,46: riverSource=4, bitmap=hill, rgb=197.5,186.2,159
- q64,59: riverSource=9, bitmap=hill, rgb=195.3,181.6,152.4
- q65,45: riverSource=4, bitmap=hill, rgb=190.8,178.5,152.2
- q65,46: riverSource=4, bitmap=hill, rgb=169.6,157.7,130.3
- q65,47: riverSource=4, bitmap=hill, rgb=171.7,161.7,132.1
- q65,49: riverSource=4, bitmap=hill, rgb=186.5,176.2,142.3
- q65,50: riverSource=4, bitmap=hill, rgb=167.8,160.1,127.4
- q65,52: riverSource=4, bitmap=hill, rgb=148.8,139.8,102.7

## Road Bitmap Prompts
- changsha-jiaozhou: samples=21, water=0, mountain=13, hill=8, forest=0, plain=0, waterRatio=0.00, roughRatio=1.00
- wuling-lingling: samples=14, water=0, mountain=10, hill=4, forest=0, plain=0, waterRatio=0.00, roughRatio=1.00
- yuzhang-changsha: samples=13, water=0, mountain=9, hill=4, forest=0, plain=0, waterRatio=0.00, roughRatio=1.00
- lingling-changsha: samples=12, water=0, mountain=6, hill=6, forest=0, plain=0, waterRatio=0.00, roughRatio=1.00
- lingling-jiaozhou: samples=11, water=0, mountain=7, hill=4, forest=0, plain=0, waterRatio=0.00, roughRatio=1.00
- lingling-panyu: samples=11, water=0, mountain=7, hill=4, forest=0, plain=0, waterRatio=0.00, roughRatio=1.00
- wuling-jingzhou: samples=11, water=0, mountain=5, hill=6, forest=0, plain=0, waterRatio=0.00, roughRatio=1.00
- chaigang-yuzhang: samples=20, water=0, mountain=11, hill=8, forest=0, plain=1, waterRatio=0.00, roughRatio=0.95
- luocheng-yongan: samples=14, water=0, mountain=7, hill=6, forest=0, plain=1, waterRatio=0.00, roughRatio=0.93
- xiapi-xuzhou: samples=9, water=0, mountain=5, hill=3, forest=0, plain=1, waterRatio=0.00, roughRatio=0.89
- wuling-yiling: samples=15, water=0, mountain=10, hill=3, forest=0, plain=2, waterRatio=0.00, roughRatio=0.87
- suzhou-huiji: samples=7, water=0, mountain=4, hill=2, forest=0, plain=1, waterRatio=0.00, roughRatio=0.86
- xiapi-shouchun: samples=12, water=0, mountain=7, hill=2, forest=0, plain=3, waterRatio=0.00, roughRatio=0.75
