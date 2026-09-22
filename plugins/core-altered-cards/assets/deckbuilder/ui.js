/* Deckbuilder — ui.js
 * Tabs, lightbox, token-arts, window exports, boot.
 * Loaded as a classic script (shared global scope with sibling modules).
 */

    // mark dirty on meta field changes
    [elDeckName, elDeckDesc].forEach(function(el) {
        if (el) el.addEventListener('input', markDirty);
    });
    [elDeckPublic].forEach(function(el) {
        if (el) el.addEventListener('change', markDirty);
    });
    if (elDeckFormat) elDeckFormat.addEventListener('change', function() {
        markDirty();
        updateDeckDisplay();
    });

    // mobile tabs
    document.querySelectorAll('.db-mobile-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.db-mobile-tab').forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            var t = tab.dataset.tab;
            // 'view' shares the left panel with 'search'
            var paneId = 'db-tab-' + (t === 'view' || t === 'hand' ? 'search' : t);
            document.querySelectorAll('.db-tab-pane').forEach(function(p) { p.classList.remove('active'); });
            var pane = document.getElementById(paneId);
            if (pane) pane.classList.add('active');
            // Switch sub-pane between search form, deck view and starting hand
            if (t === 'search' || t === 'view' || t === 'hand') {
                document.getElementById('db-search-pane-search').style.display = t === 'search' ? '' : 'none';
                document.getElementById('db-search-pane-view').style.display   = t === 'view'   ? '' : 'none';
                document.getElementById('db-search-pane-hand').style.display   = t === 'hand'   ? '' : 'none';
                document.querySelectorAll('.db-search-tab').forEach(function(st) {
                    st.classList.toggle('active', st.dataset.pane === t);
                });
                if (t === 'view') renderGridPane();
                if (t === 'hand') { renderHandPane(); if (window.HandTester && !window.HandTester.isStarted()) window.HandTester.reset(); }
            }
        });
    });

    // card lightbox
    var dbCardModal      = document.getElementById('db-card-modal');
    var dbCardModalInner = document.getElementById('db-card-modal-inner');
    function closeDbCardModal() {
        dbCardModal.style.display = 'none';
        if (dbCardModalInner._ownEnhance) { dbCardModalInner._ownEnhance.destroy(); dbCardModalInner._ownEnhance = null; }
        dbCardModalInner.innerHTML = '';
        document.body.style.overflow = '';
    }
    var detailLabel = AlteredDB.txt.detail_label;
    var cardDetailBase = AlteredDB.cardDetailBase;
    var cardDetailLang = AlteredDB.lang;
    window.openDbCardModal = function(ref) {
        dbCardModalInner.innerHTML = '';
        var cardEl;
        if (isUnique(ref)) {
            ensureRenderer();
            cardEl = document.createElement('altered-card');
            cardEl.setAttribute('ref', ref);
            cardEl.setAttribute('locale', AlteredDB.uniqueLocale);
            cardEl.style.cssText = 'display:block;width:100%;max-height:80vh;border-radius:12px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.6);cursor:pointer';
        } else {
            cardEl = document.createElement('img');
            cardEl.src = cdnUrl(ref);
            cardEl.alt = ref;
            cardEl.style.cssText = 'display:block;width:100%;max-height:80vh;object-fit:contain;border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,.6);cursor:pointer';
        }
        cardEl.addEventListener('click', closeDbCardModal);
        if (window.OWN_CARD_MODAL_ENHANCE) {
            dbCardModalInner._ownEnhance = window.OWN_CARD_MODAL_ENHANCE.enhance(dbCardModalInner, cardEl, ref, isUnique(ref), AlteredDB.ownAltArt);
        } else {
            dbCardModalInner.appendChild(cardEl);
        }
        dbCardModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };
    dbCardModal.addEventListener('click', closeDbCardModal);

    // deck quantity stepper (modal)
    function buildDbQtyControls(ref, cardData) {
        function addPayload() {
            if (cardData) return cardData;
            var c = deck.cards[ref];
            return c ? {
                cardReference: ref, name: c.name, cardTypeReference: c.type, rarity: c.rarity,
                factionCode: c.factionCode || null,
                mainCost: c.mainCost || 0, recallCost: c.recallCost || 0,
                oceanPower: c.oceanPower || 0, mountainPower: c.mountainPower || 0, forestPower: c.forestPower || 0,
                isBanned: !!c.isBanned, isSuspended: !!c.isSuspended,
            } : { cardReference: ref };
        }
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px;background:rgba(0,0,0,.32);border-radius:8px;padding:5px 10px';
        var lbl = document.createElement('span');
        lbl.style.cssText = 'color:rgba(255,255,255,.7);font-size:.76rem;white-space:nowrap';
        lbl.innerHTML = '<i class="fa-solid fa-layer-group" style="margin-right:3px"></i>' + AlteredDB.txt.tab_deck;
        var ctrl = document.createElement('div');
        ctrl.style.cssText = 'display:flex;align-items:center;gap:6px';
        var btnM = document.createElement('button');
        btnM.type = 'button'; btnM.className = 'btn btn-sm btn-outline-secondary';
        btnM.style.cssText = 'padding:1px 8px;font-size:.9rem'; btnM.textContent = '−';
        var qtyEl = document.createElement('span');
        qtyEl.style.cssText = 'color:#fff;font-weight:700;font-size:.9rem;min-width:22px;text-align:center';
        var btnP = document.createElement('button');
        btnP.type = 'button'; btnP.className = 'btn btn-sm btn-outline-secondary';
        btnP.style.cssText = 'padding:1px 8px;font-size:.9rem'; btnP.textContent = '+';
        ctrl.appendChild(btnM); ctrl.appendChild(qtyEl); ctrl.appendChild(btnP);
        row.appendChild(lbl); row.appendChild(ctrl);
        function refresh() {
            var q = deck.cards[ref] ? deck.cards[ref].qty : 0;
            qtyEl.textContent = q;
            btnM.disabled = q === 0;
        }
        btnM.addEventListener('click', function () { removeCard(ref); refresh(); });
        btnP.addEventListener('click', function () { addCard(addPayload()); refresh(); });
        refresh();
        return row;
    }

    // patch openDbCardModal: add deck quantity controls then detail button
    var _origOpenDbCardModal = window.openDbCardModal;
    window.openDbCardModal = function (ref, cardData) {
        _origOpenDbCardModal(ref);
        dbCardModalInner.appendChild(buildDbQtyControls(ref, cardData));
        var detailBtn = document.createElement('a');
        detailBtn.href = cardDetailBase + '?ref=' + encodeURIComponent(ref) + '&card_lang=' + cardDetailLang;
        detailBtn.innerHTML = '<i class="fa-solid fa-circle-info me-1"></i>' + detailLabel;
        detailBtn.className = 'btn btn-sm btn-primary-altered';
        detailBtn.style.cssText = 'display:block;width:100%;margin-top:8px;text-decoration:none';
        dbCardModalInner.appendChild(detailBtn);
    };

    // patch openDbCardModal a second time: illustration picker, only for a card
    // already in the deck (not the browse-grid preview, which passes a cardData
    // payload for a card that hasn't been added yet -- picking an art for it before
    // it exists as a deck line isn't meaningful).
    var _origOpenDbCardModal2 = window.openDbCardModal;
    window.openDbCardModal = function (ref, cardData) {
        _origOpenDbCardModal2(ref, cardData);
        if (cardData || !deck.cards[ref] || !AlteredDB.altArtsUrl || AlteredDB.altArtGlobalMode) return;

        var chooseBtn = document.createElement('button');
        chooseBtn.type = 'button';
        chooseBtn.className = 'btn btn-sm btn-outline-secondary';
        chooseBtn.style.cssText = 'display:block;width:100%;margin-top:8px';
        chooseBtn.innerHTML = '<i class="fa-solid fa-images me-1"></i>' + AlteredDB.txt.choose_illustration;
        dbCardModalInner.appendChild(chooseBtn);

        var panel = document.createElement('div');
        panel.style.cssText = 'margin-top:10px;display:none';
        dbCardModalInner.appendChild(panel);

        chooseBtn.addEventListener('click', function () {
            chooseBtn.disabled = true;
            panel.style.display = '';
            panel.innerHTML = '<div style="color:#fff;font-size:.8rem;text-align:center">' + AlteredDB.txt.loading + '</div>';

            fetchAltArtData([ref]).then(function (data) {
                chooseBtn.disabled = false;
                var group = data && data.groups[ref];
                var key = group && (group.familyId + ':' + group.faction + ':' + group.rarity);
                var opt = key && data.options[key];

                if (!opt || !opt.options || !opt.options.length) {
                    panel.innerHTML = '<div style="color:#fff;font-size:.8rem;text-align:center">'
                        + AlteredDB.txt.no_other_illustration + '</div>';
                    return;
                }

                panel.innerHTML = '';
                var grid = document.createElement('div');
                grid.id = 'db-art-grid';

                var confirmBtn = document.createElement('button');
                confirmBtn.type = 'button';
                confirmBtn.className = 'btn btn-sm btn-primary-altered';
                confirmBtn.style.cssText = 'display:block;width:100%;margin-top:8px';
                confirmBtn.disabled = true;
                confirmBtn.textContent = AlteredDB.txt.illustration_confirm;

                // Unowned illustrations stay selectable here (unlike the Alt Arts BGA
                // preference page): the deckbuilder deliberately never blocks a choice
                // on ownership -- BGA replaces it with the base art at play time if the
                // player still doesn't own enough copies when the deck is fetched.
                var selected = ref;
                opt.options.forEach(function (o) {
                    var tile = document.createElement('div');
                    tile.className = 'db-hero-tile' + (o.reference === ref ? ' selected' : '')
                        + (o.ownedQuantity === 0 ? ' db-art-tile--unowned' : '');
                    var img = document.createElement('img');
                    img.src = cdnUrl(o.reference);
                    img.alt = '';
                    tile.appendChild(img);
                    tile.addEventListener('click', function () {
                        selected = o.reference;
                        grid.querySelectorAll('.db-hero-tile').forEach(function (t) { t.classList.remove('selected'); });
                        tile.classList.add('selected');
                        confirmBtn.disabled = selected === ref;
                    });
                    grid.appendChild(tile);
                });

                panel.appendChild(grid);
                panel.appendChild(confirmBtn);

                confirmBtn.addEventListener('click', function () {
                    if (selected === ref) return;
                    markDirty();
                    var qty = deck.cards[ref].qty;
                    var template = deck.cards[ref];
                    delete deck.cards[ref];
                    if (deck.cards[selected]) {
                        deck.cards[selected].qty += qty;
                    } else {
                        deck.cards[selected] = Object.assign({}, template, { qty: qty });
                    }
                    updateDeckDisplay();
                    closeDbCardModal();
                });
            });
        });
    };

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Through dbHeroClose, not a bare hide: it is what brings the creation
            // dialog back underneath and releases the scroll lock.
            var m = document.getElementById('db-hero-modal');
            if (m && m.style.display !== 'none') { dbHeroClose(); return; }
            if (dbCardModal && dbCardModal.style.display !== 'none') closeDbCardModal();
        }
    });

    // deck panel tabs (Cards / Stats)
    document.querySelectorAll('.db-deck-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.db-deck-tab').forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            var pane = tab.dataset.pane;
            document.getElementById('db-deck-pane-cards').style.display = pane === 'cards' ? '' : 'none';
            document.getElementById('db-deck-pane-stats').style.display = pane === 'stats' ? '' : 'none';
        });
    });

    // left panel tabs (Card Search / View Deck)
    document.querySelectorAll('.db-search-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.db-search-tab').forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            var pane = tab.dataset.pane;
            document.getElementById('db-search-pane-search').style.display = pane === 'search' ? '' : 'none';
            document.getElementById('db-search-pane-view').style.display   = pane === 'view'   ? '' : 'none';
            document.getElementById('db-search-pane-hand').style.display   = pane === 'hand'   ? '' : 'none';
            if (pane === 'view') renderGridPane();
            if (pane === 'hand') { renderHandPane(); if (window.HandTester && !window.HandTester.isStarted()) window.HandTester.reset(); }
        });
    });

    // grid/list toggle for deck view pane
    var elToggleGrid = document.getElementById('db-grid-toggle-grid');
    var elToggleList = document.getElementById('db-grid-toggle-list');
    if (elToggleGrid && elToggleList) {
        elToggleGrid.addEventListener('click', function() {
            dbGridViewMode = 'grid';
            elToggleGrid.classList.add('active');
            elToggleList.classList.remove('active');
            renderGridPane();
        });
        elToggleList.addEventListener('click', function() {
            dbGridViewMode = 'list';
            elToggleList.classList.add('active');
            elToggleGrid.classList.remove('active');
            renderGridPane();
        });
    }

    if (AlteredDB.isGuest) {
        var _saved = localStorage.getItem(GUEST_DECK_KEY);
        if (_saved) { try { initFromGuest(JSON.parse(_saved)); } catch (e) {} }
        else { updateDeckDisplay(); }
    } else {
        initFromExisting();
        updateDeckDisplay();
        enrichDeckCardStatus();
        autoApplyAltArtPreferences();
    }

    // A brand-new deck opens on the creation dialog. Guard on deck.hero as well: a
    // guest deck restored from localStorage is an existing deck even without ?id=.
    if (AlteredDB.newDeckFlow && !deck.hero) dbNewOpen();

    window.renderBrowserCard = renderBrowserCard;
    // Exposed so the (separately-scoped) CardSearch engine setup can wire the
    // "Réinitialiser" button to restore the hero's faction instead of clearing it.
    window.updateHeroFactionFilter = updateHeroFactionFilter;
    window.getDeckHeroFaction = function() { return deck.hero ? deck.hero.factionCode : null; };
    // Banned/suspended-card visibility, and the Uniques tab's own adjustments,
    // depend on the deck's current format — exposed so the CardSearch engine
    // and the Uniques-tab sync below can read it live on every change.
    window.getDeckFormatLegality = function() {
        var fmtKey = elDeckFormat ? elDeckFormat.value : '';
        var fmt = (AlteredDB.formats && AlteredDB.formats[fmtKey]) || {};
        return {
            key:            fmtKey,
            allowBanned:    fmt.allowBanned    !== false,
            allowSuspended: fmt.allowSuspended !== false,
            maxUnique:      fmt.maxUnique,
        };
    };
