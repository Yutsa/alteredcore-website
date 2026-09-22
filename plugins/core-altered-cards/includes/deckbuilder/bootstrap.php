<?php
require_once __DIR__ . '/../functions.php';
$lang         = getLang();
$uiLang       = getUiLang();
$uniqueLocale = in_array($lang, ['en', 'fr'], true) ? $lang : 'en';

require_once __DIR__ . '/../../config.php';

// auth (guest access allowed when $guestModeEnabled, server save requires login)
if (!$guestModeEnabled && !kcIsLoggedIn()) {
    redirect(BASE_URL . '/pages/login?redirect=' . rawurlencode($_SERVER['REQUEST_URI'] ?? ''));
}
$isGuest = $guestModeEnabled && !kcIsLoggedIn();
$kcUser  = $isGuest ? null : kcUser();
$token   = $isGuest ? null : deckApiToken();

// collection
$_dbUserId          = (int)($_SESSION['user_id'] ?? 0);
$_collectionEnabled = defined('COLLECTION_MODE') && COLLECTION_MODE;
$_collectionMode    = $_collectionEnabled && !$isGuest && $_dbUserId > 0;
// digital ownership (AlteredOwnership service)
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
$_userCollection    = []; // {ref => qty}
$_collEntries       = []; // {ref => api_entry_id} — populated in API mode only
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
