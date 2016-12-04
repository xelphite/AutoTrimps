// ==UserScript==
// @name         AutoTrimpsV2+genBTC
// @namespace    http://tampermonkey.net/
// @version      2.1.3.7-genbtc-12-4-2016+Modular
// @description  try to take over the world!
// @author       zininzinin, spindrjr, belaith, ishakaru, genBTC
// @include      *trimps.github.io*
// @include      *kongregate.com/games/GreenSatellite/trimps
// @grant        none
// ==/UserScript==

////////////////////////////////////////
//Global Variables/////////////////////////////
////////////////////////////////////////
////////////////////////////////////////
var ATversion = '2.1.3.7-genbtc-12-4-2016+Modular';
var AutoTrimpsDebugTabVisible = true;
var enableDebug = true; //Spam console
var autoTrimpSettings = {};

var bestBuilding;
var scienceNeeded;
var breedFire = false;

var shouldFarm = false;
var enoughDamage = true;
var enoughHealth = true;

var baseDamage = 0;
var baseBlock = 0;
var baseHealth = 0;

var preBuyAmt;
var preBuyFiring;
var preBuyTooltip;
var preBuymaxSplit;

//Magic Numbers/////////////////////////
var runInterval = 100;      //How often to loop through logic
var startupDelay = 2000;    //How long to wait for everything to load


////////////////////////////////////////////////////////////////////////////////
//Main Loader Initialize Function (loads first, load everything else)///////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////
function initializeAutoTrimps() {
    debug('AutoTrimps v' + ATversion + ' Loaded!', '*spinner3');
    loadPageVariables();

    var atscript = document.getElementById('AutoTrimps-script')
      , base = 'https://genbtc.github.io/AutoTrimps'
      ;
    if (atscript !== null) {
        base = atscript.getAttribute('src').replace(/\/AutoTrimps2\.js$/, '');
    }
    //Load Modular pieces:
    document.head.appendChild(document.createElement('script')).src = base + '/utils.js';
    document.head.appendChild(document.createElement('script')).src = base + '/query.js';
    document.head.appendChild(document.createElement('script')).src = base + '/heirlooms.js';
    document.head.appendChild(document.createElement('script')).src = base + '/buildings.js';
    document.head.appendChild(document.createElement('script')).src = base + '/jobs.js';
    document.head.appendChild(document.createElement('script')).src = base + '/equipment.js';
    document.head.appendChild(document.createElement('script')).src = base + '/gather.js';    
    document.head.appendChild(document.createElement('script')).src = base + '/autostance.js';
    document.head.appendChild(document.createElement('script')).src = base + '/battlecalc.js';
    document.head.appendChild(document.createElement('script')).src = base + '/automaps.js';
    document.head.appendChild(document.createElement('script')).src = base + '/autobreedtimer.js';
    document.head.appendChild(document.createElement('script')).src = base + '/dynprestige.js';
    document.head.appendChild(document.createElement('script')).src = base + '/autofight.js';
    document.head.appendChild(document.createElement('script')).src = base + '/scryer.js';
    document.head.appendChild(document.createElement('script')).src = base + '/portal.js';
    document.head.appendChild(document.createElement('script')).src = base + '/other.js';
    document.head.appendChild(document.createElement('script')).src = base + '/upgrades.js';
    //
    document.head.appendChild(document.createElement('script')).src = base + '/NewUI2.js';
    document.head.appendChild(document.createElement('script')).src = base + '/Graphs.js';
    //Autoperks
    if (typeof(AutoPerks) === 'undefined')
        document.head.appendChild(document.createElement('script')).src = base + '/AutoPerks.js';
    else
        debug('AutoPerks is now included in Autotrimps, please disable the tampermonkey script for AutoPerks to remove this message!', '*spinner3');
    toggleSettingsMenu();
    toggleSettingsMenu();
}

////////////////////////////////////////
//Main DELAY Loop///////////////////////
////////////////////////////////////////
////////////////////////////////////////
setTimeout(delayStart, startupDelay);
function delayStart() {
    initializeAutoTrimps();
    setTimeout(delayStartAgain, startupDelay);
}
function delayStartAgain(){
    setInterval(mainLoop, runInterval);
    updateCustomButtons();
    tooltip('confirm', null, 'update', '<b>Add a farm lower level zones option (maps settings tab)</b><br>12/2 Some small changes <a href="https://github.com/genbtc/AutoTrimps/commits/gh-pages" target="#">Check commit history</a> (if you care)<br><b><u>Report any bugs/problems please!</u></b><br><a href=" https://github.com/genbtc/AutoTrimps#current-feature-changes-by-genbtc-up-to-date-as-of-11292016" target="#">Read the 11/29 Changelog Here</a><br><b>Changed Automaps</b> farming/damage/health calculations. AutoMaps farms above 16x now. (10x in Lead, 10x in Nom with the Farm on >7 NOMstacks option). <u>Hover</u> over the Farming/Advancing/WantMoreDamage status area to see the precise number now. Read the AutoMaps tooltip in settings for slightly more information.<br><b>Add dailymods:</b> weakness, rampage, oddtrimpnerf, eventrimpbuff, badStrength, badMapStrength, bloodthirst to Autostance1. (and AS2 has minDmg, maxDmg too)', 'cancelTooltip()', 'Script Update Notice ' + ATversion);
    document.getElementById('Prestige').value = autoTrimpSettings.PrestigeBackup.selected;
}

////////////////////////////////////////
//Main vars ////////////////////////////
////////////////////////////////////////
////////////////////////////////////////
var ATrunning = false;
var magmiteSpenderChanged = false;
var OVKcellsInWorld = 0;
var lastOVKcellsInWorld = 0;
var currentworld = 0;
var lastrunworld = 0;
var aWholeNewWorld = false;
var lastZoneStartTime = 0;
var ZoneStartTime = 0;

//reset stuff that may not have gotten cleaned up on portal
function mainCleanup() {
    //runs at zone 1 only.
    if (game.global.world == 1) {
        lastHeliumZone = 0;
        zonePostpone = 0;
        OVKcellsInWorld = 0;
        lastOVKcellsInWorld = 0;
        lastZoneStartTime = 0;
        ZoneStartTime = 0;
    }
    lastrunworld = currentworld;
    currentworld = game.global.world;
    aWholeNewWorld = lastrunworld != currentworld;
}

////////////////////////////////////////
//Main LOGIC Loop///////////////////////
////////////////////////////////////////
////////////////////////////////////////
function mainLoop() {
    ATrunning = true;
    if(game.options.menu.showFullBreed.enabled != 1) toggleSetting("showFullBreed");    //just better.
    addbreedTimerInsideText.innerHTML = parseFloat(game.global.lastBreedTime/1000).toFixed(1) + 's'; //add hidden next group breed timer;
    mainCleanup();
    if(getPageSetting('PauseScript') || game.options.menu.pauseGame.enabled || game.global.viewingUpgrades || ATrunning == false) return;
    game.global.addonUser = true;
    game.global.autotrimps = {
        firstgiga: getPageSetting('FirstGigastation'),
        deltagiga: getPageSetting('DeltaGigastation')
    }
    //auto-close breaking the world textbox
    if(document.getElementById('tipTitle').innerHTML == 'The Improbability') cancelTooltip();
    //auto-close the corruption at zone 181 textbox
    if(document.getElementById('tipTitle').innerHTML == 'Corruption') cancelTooltip();
    //auto-close the Spire notification checkbox
    if(document.getElementById('tipTitle').innerHTML == 'Spire') cancelTooltip();
    setTitle();          //set the browser title
    setScienceNeeded();  //determine how much science is needed

    if (getPageSetting('ExitSpireCell') >= 1) exitSpireCell(); //"Exit Spire After Cell" (genBTC settings area)
    if (getPageSetting('WorkerRatios')) workerRatios(); //"Auto Worker Ratios"
    if (getPageSetting('BuyUpgrades')) buyUpgrades();   //"Buy Upgrades"
    autoGoldenUpgrades();                               //"AutoGoldenUpgrades" (genBTC settings area)
    if (getPageSetting('BuyStorage')) buyStorage();     //"Buy Storage"
    if (getPageSetting('BuyBuildings')) buyBuildings(); //"Buy Buildings"
    if (getPageSetting('BuyJobs')) buyJobs();           //"Buy Jobs"
    if (getPageSetting('ManualGather2')<=2) manualLabor();  //"Auto Gather/Build"
    else if (getPageSetting('ManualGather2')==3) manualLabor2();  //"Auto Gather/Build #2"
    if (getPageSetting('AutoMaps')) autoMap();          //"Auto Maps"
    if (getPageSetting('GeneticistTimer') >= 0) autoBreedTimer(); //"Geneticist Timer" / "Auto Breed Timer"
    if (autoTrimpSettings.AutoPortal.selected != "Off") autoPortal();   //"Auto Portal" (hidden until level 40)
    if (getPageSetting('AutoHeirlooms2')) autoHeirlooms2(); //"Auto Heirlooms 2" (genBTC settings area)
    else if (getPageSetting('AutoHeirlooms')) autoHeirlooms();//"Auto Heirlooms"
    if (getPageSetting('TrapTrimps') && game.global.trapBuildAllowed && game.global.trapBuildToggled == false) toggleAutoTrap(); //"Trap Trimps"
    if (getPageSetting('AutoRoboTrimp')) autoRoboTrimp();   //"AutoRoboTrimp" (genBTC settings area)
    if (getPageSetting('AutoUpgradeHeirlooms') && !heirloomsShown) autoNull();  //"Auto Upgrade Heirlooms" (genBTC settings area)
    autoLevelEquipment();                                   //"Buy Armor", "Buy Armor Upgrades", "Buy Weapons", "Buy Weapons Upgrades"

    if (getPageSetting('UseScryerStance'))  useScryerStance();  //"Use Scryer Stance"
    else if (getPageSetting('AutoStance')<=1) autoStance();    //"Auto Stance"
    else if (getPageSetting('AutoStance')==2) autoStance2();   //"Auto Stance #2"

    BAFsetting = getPageSetting('BetterAutoFight');
    if (BAFsetting==1) betterAutoFight();        //"Better Auto Fight"
    else if (BAFsetting==2) betterAutoFight2();     //"Better Auto Fight2"
    else if (BAFsetting==0 && BAFsetting!=oldBAFsetting && game.global.autoBattle && game.global.pauseFight)  pauseFight();
    oldBAFsetting = BAFsetting;                                            //enables built-in autofight once when disabled

    if (getPageSetting('DynamicPrestige2')) prestigeChanging2(); //"Dynamic Prestige" (genBTC settings area)
    else autoTrimpSettings.Prestige.selected = document.getElementById('Prestige').value; //if we dont want to, just make sure the UI setting and the internal setting are aligned.

    //track how many overkill world cells we have beaten in the current level. (game.stats.cellsOverkilled.value for the entire run)
    if (game.options.menu.overkillColor.enabled == 0) toggleSetting('overkillColor');   //make sure the setting is on.
    if (aWholeNewWorld) {
        lastOVKcellsInWorld = OVKcellsInWorld;
    }
    OVKcellsInWorld = document.getElementById("grid").getElementsByClassName("cellColorOverkill").length;
    //track time in each zone for better graphs
    if (aWholeNewWorld) {
        lastZoneStartTime = new Date().getTime() - ZoneStartTime;
    }
    ZoneStartTime = game.global.zoneStarted;

    try {
        if (getPageSetting('AutoMagmiteSpender2')==2 && !magmiteSpenderChanged)
            autoMagmiteSpender();
    } catch (err) {
        debug("Error encountered in AutoMagmiteSpender(Always): " + err.message,"general");
    }
    
    //Runs any user provided scripts - by copying and pasting a function named userscripts() into the Chrome Dev console. (F12)
    if (userscriptOn) userscripts();
    //refresh the UI
    updateValueFields();
    ATrunning = false;
    //rinse, repeat
}

// Userscript loader. write your own!
var userscriptOn = true;    //controls the looping of userscripts and can be self-disabled
var globalvar0,globalvar1,globalvar2,globalvar3,globalvar4,globalvar5,globalvar6,globalvar7,globalvar8,globalvar9;
//left blank intentionally. the user will provide this. blank global vars are included as an example
function userscripts()
{
    //insert code here:
}
