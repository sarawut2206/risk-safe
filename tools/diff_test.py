# -*- coding: utf-8 -*-
"""ทดสอบเทียบสองการเขียน (differential testing): คำนวณซ้ำด้วย Python เขียนแยกจาก engine.js แล้วเทียบกับผลของ engine.js
รัน: node tools/dump_for_diff.js 3000 && python tools/diff_test.py
เขียนตามข้อกำหนดของตรรกะ (ค่าเฉลี่ย L x C, กฎยกระดับ, ค่าเฉลี่ย D, กฎเพดาน, ช่อง R, การให้คะแนนและเลือกมาตรการ) ไม่คัดลอกโค้ด"""
import json, math, os, sys
sys.stdout.reconfigure(encoding='utf-8')
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
D = json.load(open(os.path.join(root, 'analysis', 'diff_dump.json'), encoding='utf-8'))
P = D['meta']['params']
RES = {'จำกัด': (1, 4), 'ปานกลาง': (2, 6), 'เพียงพอ': (3, 8)}
GR = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
num = lambda v: isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)
mean = lambda a: sum(a) / len(a) if a else float('nan')

def level_risk(rd, override):
    if not math.isfinite(rd): return None
    if override: return 'สูง'
    return 'ต่ำ' if rd <= P['riskLow'] else ('กลาง' if rd <= P['riskMid'] else 'สูง')

def analyze(inp):
    res_code, res_max = RES.get(inp['resource'], RES['ปานกลาง'])
    # ---- 7-S ----
    els = []
    for idx, ec in enumerate(D['elements']):
        ids = [s['id'] for s in D['sevenItems'] if s['elem'] == ec]
        dv = [inp['seven'][i][0] for i in ids if i in inp['seven'] and num(inp['seven'][i][0])]
        iv = [inp['seven'][i][1] for i in ids if i in inp['seven'] and len(inp['seven'][i]) > 1 and num(inp['seven'][i][1])]
        d, i_ = mean(dv), mean(iv); gap = i_ - d; pni = (i_ - d) / d if d else float('nan')
        score = pni + gap / 1000 - (14 + idx) / 1e7 if math.isfinite(pni) else float('nan')
        els.append({'code': ec, 'd': d, 'i': i_, 'pni': pni, 'score': score})
    ranked = sorted([e for e in els if math.isfinite(e['score'])], key=lambda e: -e['score'])
    for k, e in enumerate(ranked): e['rank'] = k + 1
    dmeans = [e['d'] for e in els if math.isfinite(e['d'])]
    rm = mean(dmeans)
    before = None if not math.isfinite(rm) else ('ต่ำ' if rm <= P['readyLow'] else ('กลาง' if rm <= P['readyMid'] else 'สูง'))
    by = {e['code']: e for e in els}
    floor = before == 'สูง' and (by['STR']['d'] < P['floorD'] or by['SYS']['d'] < P['floorD'])
    final = 'กลาง' if floor else before
    top = [e['code'] for e in ranked[:3]]
    out = {'readyMean': rm, 'readyBefore': before, 'readyFinal': final, 'floorHit': floor, 'elements': els, 'domains': []}
    RO = ['สูง', 'กลาง', 'ต่ำ']; YO = ['ต่ำ', 'กลาง', 'สูง']
    for dc in D['domains']:
        pairs = [inp['risk'][r['id']] for r in D['riskItems'] if r['dom'] == dc and r['id'] in inp['risk'] and num(inp['risk'][r['id']][0]) and num(inp['risk'][r['id']][1])]
        cs = [inp['risk'][r['id']][1] for r in D['riskItems'] if r['dom'] == dc and r['id'] in inp['risk'] and num(inp['risk'][r['id']][1])]
        rd = sum(p[0] * p[1] for p in pairs) / len(pairs) if pairs else float('nan')
        ov = any(p[1] == P['overrideC'] and p[0] >= P['overrideL'] for p in pairs)
        risk = level_risk(rd, ov)
        group = 'R%d' % (RO.index(risk) * 3 + YO.index(final) + 1) if risk and final else None
        sel, stretch = [], []
        if risk and final:
            def key(b, idx):
                q = max(1, min(20, int(b['qpri']) if b['qpri'] not in (None, '') and num(b['qpri']) else 1))
                return (200000 if b['elem'] in top else 100000) - (q - 1) * 1000 - GR.get(b['evg'], 0) * 100 - idx
            fits = [(key(b, i), b) for i, b in enumerate(D['bank']) if (b['dom'] == dc or b['dom'] == 'X') and risk in b['risk'].split(',') and final in b['ready'].split(',')]
            fits.sort(key=lambda x: -x[0])
            sel = [b['id'] for s, b in fits if b['res'] <= res_code][:res_max]
            stretch = [b['id'] for s, b in fits if b['res'] > res_code][:2]
        out['domains'].append({'code': dc, 'n': len(pairs), 'rd': rd, 'cmax': max(cs) if cs else float('nan'), 'override': ov, 'risk': risk, 'group': group, 'selected': sel, 'stretch': stretch})
    return out

def same(a, b, tol=1e-9):
    if a is None or b is None: return a is b or (a is None and b is None)
    if isinstance(a, float) or isinstance(b, float):
        if (isinstance(a, float) and math.isnan(a)) or a is None: return b is None or (isinstance(b, float) and math.isnan(b))
        return abs(a - b) <= tol
    return a == b
bad, checks = [], 0
for ci, c in enumerate(D['cases']):
    py, js = analyze(c['input']), c['out']
    def chk(name, a, b, tol=1e-9):
        global checks
        checks += 1
        if not same(a, b, tol): bad.append((ci, name, a, b))
    chk('readyMean', py['readyMean'] if math.isfinite(py['readyMean']) else None, js['readyMean'])
    chk('readyBefore', py['readyBefore'], js['readyBefore']); chk('readyFinal', py['readyFinal'], js['readyFinal']); chk('floorHit', py['floorHit'], js['floorHit'])
    for pe, je in zip(py['elements'], js['elements']):
        chk('d ' + pe['code'], pe['d'] if math.isfinite(pe['d']) else None, je['d']); chk('pni ' + pe['code'], pe['pni'] if math.isfinite(pe['pni']) else None, je['pni']); chk('rank ' + pe['code'], pe.get('rank'), je['rank'])
    for pd, jd in zip(py['domains'], js['domains']):
        chk('rd ' + pd['code'], pd['rd'] if math.isfinite(pd['rd']) else None, jd['rd']); chk('override', pd['override'], jd['override']); chk('risk', pd['risk'], jd['risk']); chk('group', pd['group'], jd['group'])
        chk('selected', ','.join(pd['selected']), ','.join(jd['selected'])); chk('stretch', ','.join(pd['stretch']), ','.join(jd['stretch']))
print('profiles', len(D['cases']), 'checks', checks, 'mismatches', len(bad))
for b in bad[:10]: print('  MISMATCH', b)
sys.exit(1 if bad else 0)
