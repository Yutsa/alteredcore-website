<?php
require_once __DIR__ . '/../functions.php';
$lang         = getLang();
$uiLang       = getUiLang();
$uniqueLocale = in_array($lang, ['en', 'fr'], true) ? $lang : 'en';

require_once __DIR__ . '/../../config.php';

if (!$guestModeEnabled && !kcIsLoggedIn()) {
    redirect(BASE_URL . '/pages/login?redirect=' . rawurlencode($_SERVER['REQUEST_URI'] ?? ''));
}
$isGuest = $guestModeEnabled && !kcIsLoggedIn();
$kcUser  = $isGuest ? null : kcUser();
$token   = $isGuest ? null : deckApiToken();

$_dbUserId          = (int)($_SESSION['user_id'] ?? 0);
$_collectionEnabled = defined('COLLECTION_MODE') && COLLECTION_MODE;
$_collectionMode    = $_collectionEnabled && !$isGuest && $_dbUserId > 0;
$_ownEnabled        = defined('OWNERSHIP_API_URL') && OWNERSHIP_API_URL;
$_ownMode           = $_ownEnabled && !$isGuest && $_dbUserId > 0;
$_altArtGlobalMode  = $_ownMode && cacIsAltArtGlobalMode($_dbUserId);
$_ownAltArtActive   = ownershipIsActive() && $_altArtGlobalMode;
$ownAltArtCfg = $_ownAltArtActive ? [
    'enabled'          => true,
    'altArtsUrl'       => BASE_URL . '/papi/core-altered-cards/deck-alt-arts',
    'cdnUrl'           => CDN_URL,
    'lang'             => $lang,
    'markerImg'        => BASE_URL . '/plugins/ownership/assets/selected_alt.png',
    'setPreferenceUrl' => BASE_URL . '/papi/ownership/alt-art-set-preference',
    'csrfToken'        => csrfToken(),
    'txt'              => ['saveError' => $uiLang === 'fr' ? 'Impossible d\'enregistrer votre choix.' : 'Could not save your choice.'],
] : ['enabled' => false];
$_userCollection    = [];
$_collEntries       = [];
if ($_collectionMode) {
    $_collectionApiUrl = COLLECTION_API_URL;
    $_coll           = collGetUserCollection($_collectionApiUrl, $_dbUserId);
    $_userCollection = $_coll['collection'];
    $_collEntries    = $_coll['entries'];
}

require_once __DIR__ . '/../favorites.php';
$_favMode       = !$isGuest && $_dbUserId > 0;
$_userFavorites = $_favMode ? array_fill_keys(cacFavGetRefs($_dbUserId), true) : [];

$_ss = loadSearchSettings();
$_sharedTxt = $_ss['translations'][$uiLang] ?? [];
$txt = array_merge($_sharedTxt, [
    'en' => [
        'page_title' => 'Deck Builder',
        'new_deck' => 'New Deck',
        'edit_deck' => 'Edit Deck',
        'search_cards' => 'Search cards…',
        'search_ph' => 'Search cards…',
        'initial_msg' => 'Use filters or search to display cards.',
        'add_card' => 'Add',
        'remove_card' => 'Remove',
        'hero_slot' => 'Select a hero',
        'deck_name' => 'Deck name',
        'description' => 'Description',
        'format' => 'Format',
        'visibility' => 'Visibility',
        'public' => 'Public',
        'private' => 'Private',
        'save_btn' => 'Save deck',
        'saving' => 'Saving…',
        'saved_ok' => 'Deck saved!',
        'err_token' => 'Could not connect to the deck API.',
        'err_save' => 'Could not save the deck (HTTP %d).',
        'err_load' => 'Could not load the deck.',
        'err_connect' => 'Connection error.',
        'api_later' => 'The API is currently unavailable. Please try again later.',
        'save_retry' => 'Retry',
        'unsaved_title' => 'Unsaved changes',
        'unsaved_msg' => 'You have unsaved changes. What would you like to do?',
        'save_and_leave' => 'Save and leave',
        'leave_anyway' => 'Leave without saving',
        'stay' => 'Stay on page',
        'autosaved' => 'Autosaved',
        'deck_cards' => 'cards',
        'cards_in_deck' => 'Cards in deck',
        'hero_required' => 'A hero is required.',
        'min_cards' => 'Minimum %d cards required.',
        'max_cards' => 'Maximum %d cards.',
        'max_rare' => 'Maximum %d rare cards.',
        'max_exalted' => 'Maximum %d exalted cards.',
        'max_unique' => 'Maximum %d unique cards.',
        'max_copies' => 'Maximum %d copies of the same card.',
        'max_copies_rarity' => 'Maximum %d copy of each rarity per card name.',
        'same_faction' => 'All cards must be from the same faction.',
        'validation_ok' => 'Deck is valid.',
        'deck_invalid' => 'Invalid',
        'rules_modal_title' => 'Format rules',
        'rule_hero' => 'Hero required',
        'rule_min_cards' => 'Minimum cards',
        'rule_max_cards' => 'Maximum cards',
        'rule_max_rare' => 'Rare limit',
        'rule_max_exalted' => 'Exalted limit',
        'rule_max_unique' => 'Unique limit',
        'rule_copies' => 'Copies per card name',
        'rule_copies_rarity' => 'Copies per rarity',
        'rule_unique_copies' => 'Copies per unique',
        'rule_same_faction' => 'Single faction',
        'rule_no_banned' => 'Banned cards not allowed',
        'rule_no_suspended' => 'Suspended cards not allowed',
        'rule_frontier_legal' => 'Unique cards must be part of the Frontier allowlist',
        'rule_set_legal' => 'Cards must be from a set legal in this format',
        'tt_show_banned_suspended' => 'Show suspended and banned cards (hidden by default for this format)',
        'tt_banned_suspended_allowed' => 'The selected format already allows suspended and banned cards — this filter has no effect',
        'lbl_banned_suspended' => 'Suspended & banned',
        'unique_not_allowed' => 'The selected format doesn\'t allow any Unique cards in this deck.',
        'hero_label' => 'Hero',
        'choose_hero' => 'Choose hero',
        'change_hero' => 'Change hero',
        'select_hero_msg' => 'Choose a hero to start building your deck.',
        'hero_confirm' => 'Choose this hero',
        'wizard_hero_msg' => 'Choose a hero. It sets your faction and the cards you can play.',
        'wizard_cancel' => 'Cancel',
        'wizard_create' => 'Create deck',
        'wizard_creating' => 'Creating…',
        'wizard_change' => 'Change',
        'wizard_hero_req' => 'Choose a hero.',
        'wizard_name_req' => 'Give your deck a name.',
        'wizard_fmt_req' => 'Pick a format.',
        'wizard_vis_priv' => 'Visible to you only. Changeable at any time.',
        'wizard_desc_add' => 'Add a description',
        'wizard_anyway' => 'Continue without saving',
        'fmt_cards' => '%1$s–%2$s cards',
        'fmt_singleton' => '1 copy per card',
        'fmt_no_unique' => 'no unique cards',
        'fmt_max_unique' => 'up to %d uniques',
        'fmt_frontier' => 'Frontier-legal uniques only',
        'fmt_free' => 'no restrictions',
        'bga_ok' => 'BGA - Available',
        'bga_fmt_ko' => 'BGA - Format unavailable',
        'bga_hero_ko' => 'BGA - Hero unavailable',
        'bga_hero_partial' => 'BGA - Availability depends on format',
        'bga_arena' => 'BGA Arena',
        'bga_arena_title' => 'Format currently used by Board Game Arena for Arena mode, its competitive queue.',
        'bga_hero_title' => 'This hero only exists in sets that are not on Board Game Arena. The deck can still be built here.',
        'bga_partial_title' => 'This hero is only available in some Board Game Arena formats — the format list says which.',
        'lbl_status' => 'Status',
        'status_auto' => 'Auto',
        'status_draft' => 'Draft',
        'status_final' => 'Final',
        'tab_search' => 'Search',
        'tab_deck' => 'Deck',
        'tab_cards' => 'Cards',
        'tab_stats' => 'Stats',
        'tab_hand' => 'Starting hand',
        'tab_grid' => 'View Deck',
        'stats_cost_main' => 'Hand cost curve',
        'stats_cost_recall' => 'Reserve cost curve',
        'stats_types' => 'Card types',
        'stats_powers' => 'Avg. powers',
        'no_cards' => 'No cards in the deck.',
        'guest_banner' => 'Guest mode — Your deck is saved locally in this browser (1 deck max).',
        'guest_login' => 'Log in',
        'guest_login_why' => 'to save on the server and manage multiple decks.',
        'guest_saved_ok' => 'Deck saved locally!',
        'official' => 'Official',
        'community' => 'Community',
        'login_required' => 'Login required',
        'stock_warn' => 'More in deck than owned',
        'unnamed' => 'Unnamed',
        'detail_label' => 'View detail',
        'bga_sets_info' => 'The following sets are not yet available on Board Game Arena and cannot be used in BGA games: %s.',
        'bga_alt_art_info' => 'You can pick a specific illustration for any card below, even one you don\'t own yet — on Board Game Arena, illustrations you don\'t own enough copies of are automatically replaced by their base art when the deck is played.',
        'choose_token_arts_btn' => 'Choose token illustrations',
        'token_arts_title' => 'Token illustrations',
        'token_arts_warning' => 'Token illustration preferences are shared across every deck — they aren\'t part of this deck\'s own card list.',
        'token_arts_empty' => 'No token has more than one illustration.',
        'token_arts_close' => 'Close',
        'token_save_error' => 'Could not save your choice.',
        'choose_illustration' => 'Choose illustration',
        'illustration_confirm' => 'Use this illustration',
        'no_other_illustration' => 'No other illustration is available for this card.',
        'alt_art_stock_warn' => 'Only %owned% of the %needed% copies used in this deck are owned for this illustration — on Board Game Arena, the rest will be shown with the base art.',
    ],
    'fr' => [
        'page_title' => 'Deckbuilder',
        'new_deck' => 'Nouveau Deck',
        'edit_deck' => 'Modifier le Deck',
        'search_cards' => 'Rechercher des cartes…',
        'search_ph' => 'Rechercher par nom…',
        'initial_msg' => 'Utilisez les filtres ou la recherche pour afficher des cartes.',
        'add_card' => 'Ajouter',
        'remove_card' => 'Retirer',
        'hero_slot' => 'Choisir un héros',
        'deck_name' => 'Nom du deck',
        'description' => 'Description',
        'format' => 'Format',
        'visibility' => 'Visibilité',
        'public' => 'Public',
        'private' => 'Privé',
        'save_btn' => 'Sauvegarder',
        'saving' => 'Sauvegarde…',
        'saved_ok' => 'Deck sauvegardé !',
        'err_token' => 'Impossible de se connecter à l\'API de decks.',
        'err_save' => 'Impossible de sauvegarder le deck (HTTP %d).',
        'err_load' => 'Impossible de charger le deck.',
        'err_connect' => 'Erreur de connexion.',
        'api_later' => 'L\'API est actuellement indisponible. Veuillez réessayer plus tard.',
        'save_retry' => 'Réessayer',
        'unsaved_title' => 'Modifications non sauvegardées',
        'unsaved_msg' => 'Vous avez des modifications non sauvegardées. Que voulez-vous faire ?',
        'save_and_leave' => 'Sauvegarder et quitter',
        'leave_anyway' => 'Quitter sans sauvegarder',
        'stay' => 'Rester sur la page',
        'autosaved' => 'Sauvegardé',
        'deck_cards' => 'cartes',
        'cards_in_deck' => 'Cartes dans le deck',
        'hero_required' => 'Un héros est requis.',
        'min_cards' => '%d cartes minimum requises.',
        'max_cards' => '%d cartes maximum.',
        'max_rare' => '%d cartes rares maximum.',
        'max_exalted' => '%d cartes exaltées maximum.',
        'max_unique' => '%d cartes uniques maximum.',
        'max_copies' => '%d copies maximum d\'une même carte.',
        'max_copies_rarity' => '%d copie maximum par rareté pour un même nom de carte.',
        'same_faction' => 'Toutes les cartes doivent être de la même faction.',
        'validation_ok' => 'Deck valide.',
        'deck_invalid' => 'Invalide',
        'rules_modal_title' => 'Règles du format',
        'rule_hero' => 'Héros requis',
        'rule_min_cards' => 'Cartes minimum',
        'rule_max_cards' => 'Cartes maximum',
        'rule_max_rare' => 'Limite rares',
        'rule_max_exalted' => 'Limite exaltées',
        'rule_max_unique' => 'Limite uniques',
        'rule_copies' => 'Copies par nom de carte',
        'rule_copies_rarity' => 'Copies par rareté',
        'rule_unique_copies' => 'Copies par unique',
        'rule_same_faction' => 'Faction unique',
        'rule_no_banned' => 'Cartes bannies non autorisées',
        'rule_no_suspended' => 'Cartes suspendues non autorisées',
        'rule_frontier_legal' => 'Les cartes uniques doivent faire partie de la liste autorisée Frontier',
        'rule_set_legal' => 'Les cartes doivent provenir d\'un set légal dans ce format',
        'tt_show_banned_suspended' => 'Afficher les cartes suspendues et bannies (masquées par défaut pour ce format)',
        'tt_banned_suspended_allowed' => 'Le format sélectionné autorise déjà les cartes suspendues et bannies — ce filtre est sans effet',
        'lbl_banned_suspended' => 'Suspendus et bannis',
        'unique_not_allowed' => 'Le format sélectionné n\'autorise aucune carte Unique dans ce deck.',
        'hero_label' => 'Héros',
        'choose_hero' => 'Choisir héros',
        'change_hero' => 'Changer de héros',
        'select_hero_msg' => 'Choisissez un héros pour commencer à construire votre deck.',
        'hero_confirm' => 'Choisir ce héros',
        'wizard_hero_msg' => 'Choisissez un héros. Il détermine votre faction et les cartes disponibles.',
        'wizard_cancel' => 'Annuler',
        'wizard_create' => 'Créer le deck',
        'wizard_creating' => 'Création…',
        'wizard_change' => 'Changer',
        'wizard_hero_req' => 'Choisissez un héros.',
        'wizard_name_req' => 'Donnez un nom à votre deck.',
        'wizard_fmt_req' => 'Choisissez un format.',
        'wizard_vis_priv' => 'Visible de vous seul. Modifiable à tout moment.',
        'wizard_desc_add' => 'Ajouter une description',
        'wizard_anyway' => 'Continuer sans sauvegarder',
        'fmt_cards' => '%1$s à %2$s cartes',
        'fmt_singleton' => '1 exemplaire par carte',
        'fmt_no_unique' => 'sans cartes uniques',
        'fmt_max_unique' => '%d uniques maximum',
        'fmt_frontier' => 'uniques de la liste Frontier',
        'fmt_free' => 'aucune contrainte',
        'bga_ok' => 'BGA - Disponible',
        'bga_fmt_ko' => 'BGA - Format indisponible',
        'bga_hero_ko' => 'BGA - Héros indisponible',
        'bga_hero_partial' => 'BGA - Disponible selon format',
        'bga_arena' => 'Arène BGA',
        'bga_arena_title' => 'Format actuellement utilisé par Board Game Arena pour le mode Arène, sa file compétitive.',
        'bga_hero_title' => 'Ce héros n\'existe que dans des sets absents de Board Game Arena. Le deck reste constructible ici.',
        'bga_partial_title' => 'Ce héros n\'est disponible que sur certains formats Board Game Arena — la liste des formats précise lesquels.',
        'lbl_status' => 'Statut',
        'status_auto' => 'Auto',
        'status_draft' => 'Brouillon',
        'status_final' => 'Final',
        'tab_search' => 'Recherche',
        'tab_deck' => 'Deck',
        'tab_cards' => 'Cartes',
        'tab_stats' => 'Stats',
        'tab_hand' => 'Main de départ',
        'tab_grid' => 'Voir le deck',
        'stats_cost_main' => 'Courbe coût main',
        'stats_cost_recall' => 'Courbe coût réserve',
        'stats_types' => 'Types de cartes',
        'stats_powers' => 'Puissances moy.',
        'no_cards' => 'Aucune carte dans le deck.',
        'guest_banner' => 'Mode invité — Votre deck est sauvegardé localement dans ce navigateur (1 deck maximum).',
        'guest_login' => 'Connectez-vous',
        'guest_login_why' => 'pour sauvegarder sur le serveur et gérer plusieurs decks.',
        'guest_saved_ok' => 'Deck sauvegardé localement !',
        'official' => 'Officiel',
        'community' => 'Communauté',
        'login_required' => 'Connexion requise',
        'stock_warn' => 'Plus dans le deck que possédé',
        'unnamed' => 'Sans nom',
        'detail_label' => 'Accéder au détail',
        'bga_sets_info' => 'Les sets suivants ne sont pas encore disponibles sur Board Game Arena et ne sont donc pas légaux en partie BGA : %s.',
        'bga_alt_art_info' => 'Vous pouvez choisir une illustration précise pour chaque carte ci-dessous, même une que vous ne possédez pas encore — sur Board Game Arena, les illustrations dont vous n\'avez pas assez d\'exemplaires sont automatiquement remplacées par leur art de base au moment de jouer le deck.',
        'choose_token_arts_btn' => 'Choisir les arts des jetons',
        'token_arts_title' => 'Illustrations des jetons',
        'token_arts_warning' => 'Les préférences d\'illustration des jetons sont communes à tous les decks — elles ne font pas partie de la liste de cartes de ce deck.',
        'token_arts_empty' => 'Aucun jeton n\'a plus d\'une illustration.',
        'token_arts_close' => 'Fermer',
        'token_save_error' => 'Impossible d\'enregistrer votre choix.',
        'choose_illustration' => 'Choisir une illustration',
        'illustration_confirm' => 'Utiliser cette illustration',
        'no_other_illustration' => 'Aucune autre illustration n\'est disponible pour cette carte.',
        'alt_art_stock_warn' => 'Seuls %owned% des %needed% exemplaires utilisés dans ce deck sont possédés pour cette illustration — sur Board Game Arena, le reste sera affiché avec l\'art de base.',
    ],
][$uiLang] ?? []);
$txt += cacStartingHandStatsTxt($uiLang);

require __DIR__ . '/ajax-save.php';

$editDeckId   = trim($_GET['id'] ?? '');
$existingDeck = null;
$apiError     = null;

if ($editDeckId && $token) {
    $ch = curl_init(DECKS_API_URL . '/api/decks/' . rawurlencode($editDeckId) . '?locale=' . rawurlencode($lang));
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ['Accept: application/json', 'Authorization: Bearer ' . $token],
        CURLOPT_TIMEOUT        => 15,
    ]);
    $response = curl_exec($ch);
    $code     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code >= 200 && $code < 300 && $response) {
        $existingDeck = json_decode($response, true);
    } else {
        $apiError = $txt['err_load'];
    }
}

$_existingHeroFaction = null;
if ($existingDeck) {
    $_existingHeroCards = $existingDeck['deckCards'] ?? $existingDeck['cards'] ?? [];
    foreach ($_existingHeroCards as $_hc) {
        if (($_hc['cardTypeReference'] ?? '') === 'HERO') {
            $_existingHeroFaction = $_hc['factionCode'] ?? null;
            break;
        }
    }
}

$factionsData = loadAlteredData('factions');
$formatsData  = loadAlteredData('formats');
$setsData     = loadAlteredData('sets');
$subtypesData = loadAlteredData('subtypes');
$raritiesData = loadAlteredData('rarities');
$keywordsData   = loadAlteredData('keywords');
$typesData      = loadAlteredData('types');
$typesMergedData = loadAlteredData('types_merged');
$variationsData = loadAlteredData('variations');
$powersData     = loadAlteredData('powers');

$validFactions  = array_keys($factionsData);
$validTypes     = array_keys($typesData);

$_mergedKeys = array_keys($typesMergedData);
$_absorbedTypes = [];
foreach ($typesMergedData as $_mk => $_mvs) {
    foreach ($_mvs as $_mv) {
        if (!in_array($_mv, $_mergedKeys, true)) {
            $_absorbedTypes[$_mv] = true;
        }
    }
}
$typesDataDisplay = array_diff_key($typesData, $_absorbedTypes);
$_defaultDeckTypes = array_keys(array_diff_key($typesDataDisplay, array_flip(['HERO', 'TOKEN', 'TOKEN_MANA'])));
$validRarities  = array_keys($raritiesData);
$validSets      = array_keys($setsData);
$validCostPower = array_map('strval', range(0, 12));

$defaultFactions = array_values(array_intersect((array)($_ss['default_factions'] ?? []), $validFactions));
$defaultSets     = array_values(array_intersect((array)($_ss['default_sets']     ?? []), $validSets));
$defaultRarities = array_values(array_intersect((array)($_ss['default_rarities'] ?? []), $validRarities));
$defaultTypes    = array_values(array_intersect((array)($_ss['default_types']    ?? []), $validTypes));
$_raw1        = $_ss['default_sort_1'] ?? 'default';
$_raw2        = $_ss['default_sort_2'] ?? null;
$validSorts   = array_keys($txt['sorts'] ?? []);
$defaultSort1 = in_array($_raw1, $validSorts) ? $_raw1 : 'default';
$defaultSort2 = ($_raw2 && in_array($_raw2, $validSorts)) ? $_raw2 : null;
$_defaultDbCols  = max(2, min(4, (int)($_ss['default_cols_db'] ?? 3)));

$_heroSS         = $_ss['default_heroes'] ?? [];
$_heroTypes      = array_values(array_intersect((array)($_heroSS['types']      ?? ['HERO']),                   $validTypes));
$_heroRarities   = array_values(array_intersect((array)($_heroSS['rarities']   ?? array_values(array_diff(array_keys($raritiesData), ['UNIQUE']))), $validRarities));
$_heroSets       = array_values(array_intersect((array)($_heroSS['sets']       ?? []),                         $validSets));
$_heroVariations = array_values(array_intersect((array)($_heroSS['variations'] ?? []),                         array_keys($variationsData)));
$_heroSort1           = in_array($_heroSS['sort_1'] ?? '', $validSorts) ? $_heroSS['sort_1'] : null;
$_heroSort2           = in_array($_heroSS['sort_2'] ?? '', $validSorts) ? $_heroSS['sort_2'] : null;
$_heroReferenceFilter = (string)($_heroSS['referenceFilter'] ?? '');
$_heroSortAlpha       = !empty($_heroSS['sort_alpha']);
$_heroNoDuplicate     = !empty($_heroSS['no_duplicate']);
$_heroDuplicateOrder  = (($_heroSS['duplicate_order'] ?? '') === 'desc') ? 'desc' : 'asc';
$_defaultVariations = array_values(array_intersect((array)($_ss['default_variations'] ?? []),                  array_keys($variationsData)));
$defaultCollection  = $_ss['default_collection'] ?? 'official';

$factionNames = array_map(fn($f) => $f[$uiLang] ?? $f['en'], $factionsData);
$rarityGems      = array_map(fn($r) => $r['gem'], $raritiesData);
$_rarityGemColors = [];
foreach ($raritiesData as $_rd) {
    if (!empty($_rd['gem'])) $_rarityGemColors[$_rd['gem']] = $_rd['color'] ?? '';
}
$txt['types'] = array_map(fn($t) => $t[$uiLang] ?? $t['en'], $typesData);
$txt['types']['OTHER'] = $uiLang === 'fr' ? 'Autre' : 'Other';

$setOptionsJson = json_encode(array_values(array_map(
    fn($ref, $set) => [
        'value'     => $ref,
        'text'      => $set[$uiLang] ?? $set['en'],
        'icon'      => $set['icon'] ?? '',
        'type'      => $set['type'] ?? 'official',
        'publisher' => $set['publisher'] ?? 'Equinox',
        'subtype'   => $set['subtype'] ?? 'main',
    ],
    array_keys($setsData), array_values($setsData)
)));
$subtypeOptionsJson = json_encode(array_values(array_map(
    fn($code, $names) => ['value' => $code, 'text' => $names[$uiLang] ?? $names['en']],
    array_keys($subtypesData), array_values($subtypesData)
)));
$keywordOptionsJson = json_encode(array_values(array_map(
    fn($code, $names) => ['value' => $code, 'text' => $names[$uiLang] ?? $names['en']],
    array_keys($keywordsData), array_values($keywordsData)
)));
$variationOptionsJson = json_encode(array_values(array_map(
    fn($code, $names) => ['value' => $code, 'text' => $names[$uiLang] ?? $names['en']],
    array_keys($variationsData), array_values($variationsData)
)));
$pageTitle = $editDeckId ? $txt['edit_deck'] : $txt['new_deck'];
?>
