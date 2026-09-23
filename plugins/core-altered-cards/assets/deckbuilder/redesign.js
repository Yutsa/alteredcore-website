/* Deckbuilder — redesign.js
 * Opt-in layout directions for design review: ?ui=a|b|c (remembered), ?ui=off to reset.
 * Each direction is a set of features; CSS lives in redesign.css under html[data-db-ui].
 * Loaded as a classic script (shared global scope with sibling modules).
 */
(function() {
    var DIRECTIONS = {
        a: { label: 'A · Mobile drawer', features: ['toast', 'deckbar', 'filterToggle'] },
        b: { label: 'B · Dense desktop', features: ['rowFlash', 'tabBadge'] },
        c: { label: 'C · Status strip',  features: ['toast', 'strip', 'tabBadge'] },
    };
    var STORAGE_KEY = 'db-ui-direction';

    var param = new URLSearchParams(location.search).get('ui');
    if (param === 'off') localStorage.removeItem(STORAGE_KEY);
    else if (DIRECTIONS[param]) localStorage.setItem(STORAGE_KEY, param);
    var dirKey = param === 'off' ? null : (DIRECTIONS[param] ? param : localStorage.getItem(STORAGE_KEY));
    var dir = DIRECTIONS[dirKey];
    if (!dir) return;

    document.documentElement.dataset.dbUi = dirKey;
    var has = function(f) { return dir.features.indexOf(f) !== -1; };
    var txt = AlteredDB.txt;

    function el(tag, cls, html) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (html !== undefined) n.innerHTML = html;
        return n;
    }

    function summary() {
        var total = 0;
        Object.keys(deck.cards).forEach(function(ref) { total += deck.cards[ref].qty; });
        var rules = AlteredDB.formats[elDeckFormat ? elDeckFormat.value : deck.format] || {};
        return {
            total: total,
            min: rules.minCards || 0,
            max: rules.maxCards || 0,
            valid: !!deck._valid,
            hero: deck.hero,
        };
    }

    function restart(node, cls) {
        node.classList.remove(cls);
        void node.offsetWidth;
        node.classList.add(cls);
    }

    function renderSwitcher() {
        var bar = el('div', 'db-rd-switcher');
        bar.appendChild(el('span', 'db-rd-switcher-lbl', 'Design preview'));
        [['off', 'Current']].concat(Object.keys(DIRECTIONS).map(function(k) { return [k, DIRECTIONS[k].label]; }))
            .forEach(function(opt) {
                var a = el('a', 'db-rd-switcher-opt' + (opt[0] === dirKey ? ' active' : ''), escHtml(opt[1]));
                var url = new URL(location.href);
                url.searchParams.set('ui', opt[0]);
                a.href = url.pathname + url.search;
                bar.appendChild(a);
            });
        var title = document.querySelector('.section-title');
        if (title) title.insertAdjacentElement('afterend', bar);
    }

    var toast, toastTimer;
    function showToast(d) {
        if (!toast) {
            toast = el('div', 'db-rd-toast');
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            document.body.appendChild(toast);
        }
        var name = typeof d.name === 'object' ? (d.name[AlteredDB.lang] || d.name.en || '') : (d.name || '');
        var icon = d.change > 0 ? 'fa-plus' : 'fa-minus';
        toast.innerHTML = '<i class="fa-solid ' + icon + '"></i>'
            + '<span class="db-rd-toast-name">' + escHtml(name) + '</span>'
            + '<span class="db-rd-toast-qty">×' + d.qty + '</span>';
        if (d.change > 0) {
            var undo = el('button', 'db-rd-toast-undo', 'Undo');
            undo.type = 'button';
            undo.onclick = function() { removeCard(d.ref); hideToast(); };
            toast.appendChild(undo);
        }
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(hideToast, 2600);
    }
    function hideToast() { if (toast) toast.classList.remove('show'); }

    function pulseTile(ref) {
        document.querySelectorAll('#db-grid .db-card-wrap').forEach(function(w) {
            if (w.dataset.ref === ref) restart(w, 'db-rd-bump');
        });
    }

    function flashRow(ref) {
        var row = elCardList.querySelector('.deck-list-item[data-ref="' + CSS.escape(ref) + '"]');
        if (!row) return;
        restart(row, 'db-rd-flash');
        row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    var deckbar, sheetBackdrop;
    function buildDeckbar() {
        deckbar = el('button', 'db-rd-deckbar');
        deckbar.type = 'button';
        deckbar.setAttribute('data-db-open-deck', '');
        deckbar.innerHTML = '<span class="db-rd-deckbar-hero"></span>'
            + '<span class="db-rd-deckbar-main">'
            +   '<span class="db-rd-deckbar-count"></span>'
            +   '<span class="db-rd-progress"><span class="db-rd-progress-fill"></span></span>'
            + '</span>'
            + '<span class="db-rd-deckbar-state"></span>'
            + '<i class="fa-solid fa-chevron-up db-rd-deckbar-chev"></i>';
        document.body.appendChild(deckbar);

        var panel = document.getElementById('db-tab-deck');
        var handle = el('button', 'db-rd-sheet-handle', '<span></span>');
        handle.type = 'button';
        handle.setAttribute('aria-label', txt.tab_deck || 'Deck');
        panel.insertBefore(handle, panel.firstChild);
        sheetBackdrop = el('div', 'db-rd-sheet-backdrop');
        document.body.appendChild(sheetBackdrop);

        function setOpen(open) {
            document.documentElement.classList.toggle('db-rd-sheet-open', open);
            deckbar.setAttribute('aria-expanded', open ? 'true' : 'false');
        }
        deckbar.addEventListener('click', function() { setOpen(!document.documentElement.classList.contains('db-rd-sheet-open')); });
        handle.addEventListener('click', function() { setOpen(false); });
        sheetBackdrop.addEventListener('click', function() { setOpen(false); });
    }

    function renderDeckbar(s) {
        deckbar.querySelector('.db-rd-deckbar-hero').innerHTML = s.hero
            ? '<img src="' + escAttr(cdnUrl(s.hero.cardReference)) + '" alt="">' : '<i class="fa-solid fa-person-rays"></i>';
        deckbar.querySelector('.db-rd-deckbar-count').innerHTML = '<strong>' + s.total + '</strong>'
            + (s.min ? ' / ' + s.min : '') + ' ' + escHtml(txt.deck_cards);
        deckbar.querySelector('.db-rd-progress-fill').style.width = (s.min ? Math.min(100, s.total / s.min * 100) : 100) + '%';
        var state = deckbar.querySelector('.db-rd-deckbar-state');
        state.className = 'db-rd-deckbar-state ' + (s.valid ? 'ok' : 'ko');
        state.innerHTML = s.valid ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-exclamation"></i>';
    }

    function buildFilterToggle() {
        var head = document.querySelector('#db-panel .cs-adv-head');
        if (!head) return;
        var btn = el('button', 'btn btn-sm btn-outline-secondary db-rd-filter-toggle', '<i class="fa-solid fa-sliders me-1"></i>Filters');
        btn.type = 'button';
        btn.addEventListener('click', function() {
            var panel = document.getElementById('db-panel');
            panel.classList.toggle('db-rd-filters-open');
            btn.classList.toggle('active', panel.classList.contains('db-rd-filters-open'));
        });
        head.insertBefore(btn, head.firstChild);
    }

    function renderTabBadge(s) {
        var tab = document.querySelector('.db-mobile-tab[data-tab="deck"]');
        if (!tab) return;
        var b = tab.querySelector('.db-rd-tab-badge');
        if (!b) { b = el('span', 'db-rd-tab-badge'); tab.appendChild(b); }
        b.textContent = s.total;
        b.classList.toggle('ok', s.valid);
    }

    var strip;
    var SAVE_LABELS = {
        idle:   ['fa-cloud', 'Saved'],
        dirty:  ['fa-pen', 'Unsaved changes'],
        saving: ['fa-spinner fa-spin', txt.saving || 'Saving…'],
        saved:  ['fa-check', 'Saved'],
        error:  ['fa-triangle-exclamation', 'Save failed'],
    };
    function buildStrip() {
        strip = el('div', 'db-rd-strip');
        strip.innerHTML = '<span class="db-rd-strip-hero"></span>'
            + '<span class="db-rd-strip-id"><span class="db-rd-strip-name"></span><span class="db-rd-strip-sub"></span></span>'
            + '<span class="db-rd-strip-progress"><span class="db-rd-strip-count"></span><span class="db-rd-progress"><span class="db-rd-progress-fill"></span></span></span>'
            + '<button type="button" class="db-rd-chip db-rd-strip-valid"></button>'
            + '<span class="db-rd-chip db-rd-strip-save" data-state="idle"></span>'
            + '<button type="button" class="btn btn-sm btn-primary-altered db-rd-strip-savebtn"><i class="fa-solid fa-floppy-disk"></i><span class="d-none d-md-inline ms-1">' + escHtml(txt.save_btn || 'Save') + '</span></button>';
        var layout = document.querySelector('.db-layout');
        layout.parentNode.insertBefore(strip, layout);
        strip.querySelector('.db-rd-strip-valid').addEventListener('click', function() {
            var badge = elValidation.querySelector('.badge');
            if (badge) badge.click();
        });
        strip.querySelector('.db-rd-strip-savebtn').addEventListener('click', function() { elSaveBtn.click(); });
        renderSaveState('idle');
    }
    function renderStrip(s) {
        strip.querySelector('.db-rd-strip-hero').innerHTML = s.hero
            ? '<img src="' + escAttr(cdnUrl(s.hero.cardReference)) + '" alt="">' : '<i class="fa-solid fa-person-rays"></i>';
        strip.querySelector('.db-rd-strip-name').textContent = (elDeckName && elDeckName.value) || '—';
        strip.querySelector('.db-rd-strip-sub').textContent = s.hero ? (typeof s.hero.name === 'object' ? (s.hero.name[AlteredDB.lang] || s.hero.name.en) : s.hero.name) : '';
        strip.querySelector('.db-rd-strip-count').innerHTML = '<strong>' + s.total + '</strong>' + (s.min ? ' / ' + s.min : '');
        strip.querySelector('.db-rd-progress-fill').style.width = (s.min ? Math.min(100, s.total / s.min * 100) : 100) + '%';
        strip.classList.toggle('is-complete', !!s.min && s.total >= s.min);
        var v = strip.querySelector('.db-rd-strip-valid');
        v.className = 'db-rd-chip db-rd-strip-valid ' + (s.valid ? 'ok' : 'ko');
        v.innerHTML = s.valid ? '<i class="fa-solid fa-check"></i><span>' + escHtml(txt.validation_ok) + '</span>'
                              : '<i class="fa-solid fa-circle-exclamation"></i><span>' + escHtml(txt.deck_invalid) + '</span>';
    }
    var saveFadeTimer;
    function renderSaveState(state) {
        var chip = strip.querySelector('.db-rd-strip-save');
        var l = SAVE_LABELS[state];
        chip.dataset.state = state;
        chip.innerHTML = '<i class="fa-solid ' + l[0] + '"></i><span>' + escHtml(l[1]) + '</span>';
        clearTimeout(saveFadeTimer);
        if (state === 'saved') saveFadeTimer = setTimeout(function() { chip.dataset.state = 'idle'; }, 2500);
    }

    // Sticky elements sit below the theme's sticky header, whose height varies by breakpoint.
    function syncHeaderOffset() {
        var h = document.querySelector('.site-header');
        var px = h && getComputedStyle(h).position === 'sticky' ? h.offsetHeight : 0;
        document.documentElement.style.setProperty('--db-rd-header', px + 'px');
    }

    function refresh() {
        var s = summary();
        if (deckbar) renderDeckbar(s);
        if (strip) renderStrip(s);
        if (has('tabBadge')) renderTabBadge(s);
    }

    syncHeaderOffset();
    window.addEventListener('resize', syncHeaderOffset);
    renderSwitcher();
    if (has('deckbar')) buildDeckbar();
    if (has('filterToggle')) buildFilterToggle();
    if (has('strip')) buildStrip();
    refresh();

    document.addEventListener('db:deck-updated', refresh);
    if (elDeckName) elDeckName.addEventListener('input', refresh);
    document.addEventListener('db:card-delta', function(e) {
        var d = e.detail;
        pulseTile(d.ref);
        if (has('toast')) showToast(d);
        if (has('rowFlash')) flashRow(d.ref);
        if (deckbar) restart(deckbar, 'db-rd-bump');
        if (strip) restart(strip.querySelector('.db-rd-strip-progress'), 'db-rd-bump');
        var tab = document.querySelector('.db-mobile-tab[data-tab="deck"] .db-rd-tab-badge');
        if (tab) restart(tab, 'db-rd-bump');
    });
    document.addEventListener('db:save-state', function(e) { if (strip) renderSaveState(e.detail.state); });
})();
