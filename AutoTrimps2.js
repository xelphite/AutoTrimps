// ==UserScript==
// @name         AutoTrimpsV2
// @version      2.1.6.9b-genbtc-4-2-2018
// @updateURL    https://github.com/genbtc/AutoTrimps/AutoTrimps2.js
// @description  Automate all the trimps!
// @author       zininzinin, spindrjr, belaith, ishakaru, genBTC, Unihedron, coderPatsy, Kfro, Zeker0, Meowchan
// @include      *trimps.github.io*
// @include      *kongregate.com/games/GreenSatellite/trimps
// @grant        none
// ==/UserScript==
var ATversion = '2.1.7.1'; //when this increases it forces users setting update to newer version format

//<script type="text/javascript" src="AutoTrimps/AutoTrimps2.js?"></script>
////////////////////////////////////////////////////////////////////////////////
//Main Loader Initialize Function (loads first, load everything else)///////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////

var local = false;
//local = true;
var ver = "21";
var verDate = "20.9.18";

var atscript = document.getElementById('AutoTrimps-script'), 
        basepath = (local ? 'http://localhost:8383/Trimps%204/Trimps.github.io/AutoTrimps/' : 'https://notthat.github.io/AutoTrimps/'),
        modulepath = 'modules/';  
    
var initialized = false;
function startAT() {
    //first we wait for the game to load
    if((typeof game === 'undefined' || typeof loadPageVariables === 'undefined' || typeof game.options === 'undefined' || typeof game.options.menu === 'undefined' || typeof pendingLogs === 'undefined' || document.getElementById('logBtnGroup') === null)){ //game hasnt initialized yet
        setTimeout(startAT, 100);
        return;
    }
    
    if(!initialized){
        pendingLogs.AutoTrimps = []; //adds AT messages slot. needed before we can call debug()
        initializeAutoTrimps(); //loads modules asynchronously
        initialized = true;
    }
    
    //wait until all the scripts are loaded into page
    if(loadedScriptAmount !== expectedScriptAmount){
        setTimeout(startAT, 100);
        return;
    }
    
    //code to run on script launch:
    if (!local) printChangelog();
    
    highCritChance = getPlayerCritChance();
    highCritDamage = getPlayerCritDamageMult();
    highATK        = 1;
    highPB         = 0;
    lowCritChance  = getPlayerCritChance();
    lowCritDamage  = getPlayerCritDamageMult();
    lowATK         = 1;
    lowPB          = 0;
    
    //HTML For adding a 5th tab to the message window
    var ATbutton = document.createElement("button");
    ATbutton.innerHTML = 'AutoTrimps';
    ATbutton.setAttribute('id', 'AutoTrimpsFilter');
    ATbutton.setAttribute('type', 'button');
    ATbutton.setAttribute('onclick', "filterMessage2('AutoTrimps')");
    ATbutton.setAttribute('class', "btn btn-success logFlt");
    //
    var tab = document.createElement("DIV");
    tab.setAttribute('class', 'btn-group');
    tab.setAttribute('role', 'group');
    tab.appendChild(ATbutton);
    document.getElementById('logBtnGroup').appendChild(tab);
    
    if (game.achievements.zones.finished < 8)   //z60
        printLowerLevelPlayerNotice();
    //Set some game ars after we load.
    game.global.addonUser = true;
    game.global.autotrimps = true;
    heirloomCache = game.global.heirloomsExtra.length;
    MODULESdefault = JSON.parse(JSON.stringify(MODULES));
    
    //Start guiLoop
    setInterval(guiLoop, runInterval*10);
    setInterval(pauseRemovalLoop, runInterval); //TODO: this cleaner. hookup to game maybe?
    
    //hook up into runGameLoop()
    runGameLoop = (function(makeUp, now) {
        var cached_function = runGameLoop;
        return function(makeUp, now) {
            var result = cached_function.apply(this, arguments);
            ATLoop(makeUp);
            return result;
        };
    })();
    debug('AutoTrimps loaded!');
}

//This should redirect the script to wherever its being mirrored from.
if (atscript !== null) {
    basepath = atscript.src.replace(/AutoTrimps2\.js$/, '');
}

//This could potentially do something one day. like: read localhost url from tampermonkey.
// AKA do certain things when matched on a certain url.
//if (atscript.src.includes('localhost')) {;};

var loadedScriptAmount = 0;
var expectedScriptAmount = 0;
function ATscriptLoad(pathname, modulename) {
    if (modulename == null) debug("Wrong Syntax. Script could not be loaded. Try ATscriptLoad(modulepath, 'example.js'); ");
    var script = document.createElement('script');
    if (pathname == null) pathname = '';
    script.src = basepath + pathname + modulename + '.js';
    script.id = modulename + '_MODULE';
    script.onload = function(){loadedScriptAmount++;};
    expectedScriptAmount++;
    //script.setAttribute('crossorigin',"use-credentials");
    //script.setAttribute('crossorigin',"anonymous");
    document.head.appendChild(script);
}
ATscriptLoad(modulepath, 'utils');    //Load stuff needed to load other stuff:

//This starts up after game is loaded
function initializeAutoTrimps() {
    loadPageVariables();            //get autoTrimpSettings
    ATscriptLoad('','SettingsGUI');   //populate Settings GUI
    ATscriptLoad('','Graphs');        //populate Graphs
    //Load modules:
    ATmoduleList = ['query', 'portal', 'upgrades', 'heirlooms', 'buildings', 'jobs', 'equipment', 'gather', 'stance', 'battlecalc', 'maps', 'breedtimer', 'dynprestige', 'fight', 'scryer', 'magmite', 'other', 'import-export', 'perks', /*'perky',*/ 'fight-info', 'performance', 'ATcalc'];
    for (var m in ATmoduleList) 
        ATscriptLoad(modulepath, ATmoduleList[m]);
    
    //debug('AutoTrimps v' + ATversion + ' ' + ver + ' Loaded!', '*spinner3');
    debug('AutoTrimps v' + ATversion + ' ' + ver);
}

var changelogList = [];
//changelogList.push({date: " ", version: " ", description: "", isNew: true});  //TEMPLATE
//changelogList.push({date: verDate, version: ver, description: "", isNew: true});
//changelogList.push({date: "28/06/2018", version: "v0.2", description: "Backup your game before using this or any AT fork for the first time (and often)! Please Trimps responsibly!", isNew: true});
changelogList.push({date: "19.9.2018", version: "", description: "New AutoAllocate - work in progress", isNew: true});
//changelogList.push({date: "", version: "", description: "Combat setting: Helium mode / Dark Essence Mode / Push Mode.", isNew: true});
//changelogList.push({date: "", version: "", description: "AT Control GA - Automatic breed timers (smart enough for bleed/bogged dailies) and optional spire breed timer.", isNew: true});
//changelogList.push({date: "", version: "", description: "Trimpicide on Empower Dailies (toggle-able).", isNew: true});
//changelogList.push({date: "28/06/2018", version: "", description: "PRaiding. BWRaiding. Stop Coords to get next Amal. Never lose Amal. Heirloom Swapping. No Nurseries in Ice. Massive overhaul to AS windstacking he/hr% based. Stall Coords/items for more stacking. Calculate cell by cell. AutoTrimps->Display->General Spam for less spam.", isNew: false});
changelogList.push({date: "13/06/2018", version: "", description: "War was beginning ", isNew: false});

function assembleChangelog(date,version,description,isNew) {
    return (isNew)
    ? (`<b class="AutoEggs">${date} ${version} </b><b style="background-color:#32CD32"> New:</b> ${description}<br>`)
    : (`<b>${date} ${version} </b> ${description}<br>`);
}

function printChangelog() {
    var body="";
    for (var i in changelogList) {
        var $item = changelogList[i];
        var result = assembleChangelog($item.date,$item.version,$item.description,$item.isNew);
        body+=result;
    }
    var footer =
        '<b>Ongoing Development</b> - <u>Report any bugs/problems please</u>!\
        <br>Talk with the dev: <b>meowchan_#0720</b> @ <a target="#" href="https://discord.gg/0VbWe0dxB9kIfV2C">AutoTrimps Discord Channel</a>'
    ,   action = 'cancelTooltip()'
    ,   title = "AutoTrimps - Meowchan's Fork<br>" + "v" + ver + " " + verDate
    ,   acceptBtnText = "Thank you for playing AutoTrimps!"
    ,   hideCancel = true;
    tooltip('confirm', null, 'update', body+footer, action, title, acceptBtnText, null, hideCancel);
}

function printLowerLevelPlayerNotice() {
    tooltip('confirm', null, 'update', 'The fact that it works at all is misleading new players into thinking its perfect. Its not. If your highest zone is under z60, you have not unlocked the stats required, and have not experienced the full meta with its various paradigm shifts. If you are just starting, my advice is to play along naturally and use AutoTrimps as a tool, not a crutch. Play with the settings as if it was the game, Dont expect to go unattended, if AT chooses wrong, and make the RIGHT choice yourself. Additionally, its not coded to run one-time challenges for you, only repeatable ones for helium. During this part of the game, content is king - automating literally removes the fun of the game. If you find that many flaws in the automation exist for you, level up. Keep in mind the challenge of maintaining the code is that it has to work for everyone. AT cant see the future and doesnt run simulations, it exists only in the present moment. Post any suggestions on how it can be better, or volunteer to adapt the code, or produce some sort of low-level player guide with what youve learned.<br>Happy scripting! -genBTC','cancelTooltip()', '<b>LowLevelPlayer Notes:</b><br><b>PSA: </b><u>AutoTrimps was not designed for new/low-level players.</u>', "I understand I am on my own and I Accept and Continue.", null, true);
}

////////////////////////////////////////
//Global Main vars /////////////////////
////////////////////////////////////////
////////////////////////////////////////
var ATrunning = true;   //status var
var ATmessageLogTabVisible = true;    //show an AutoTrimps tab after Story/Loot/Unlocks/Combat message Log Container
var enableDebug = true; //Spam console.log with debug info

var autoTrimpSettings = {};
var MODULES = {};
var MODULESdefault = {};
var ATMODULES = {};
var ATmoduleList = [];

var bestBuilding;
var scienceNeeded;
var breedFire = false;
var hiddenBreedTimer;
var hiddenBreedTimerLast;

var shouldFarm = false;
var enoughDamage = true;
var enoughHealth = true;

var baseBlock = 0;
var baseHealth = 0;

var preBuyAmt;
var preBuyFiring;
var preBuyTooltip;
var preBuymaxSplit;

var currentworld = 0;
var lastrunworld = 0;
var aWholeNewWorld = false;
var needGymystic = true;    //used in setScienceNeeded, buildings.js, equipment.js
var heirloomFlag = false;
var heirloomCache;
var magmiteSpenderChanged = false;

var windMult = 1;
var poisonMultFixed=0.05;
var poisonMult = 1;
var enemyHealth=1;
var threshold=1;
var DHratio = 0;
var formattedRatio = "";
var nextZoneDHratio = 0;
var maxAnti;
var wantedAnticipation = maxAnti;
var highestPrestigeOwned = 0;
var allowBuyingCoords = true;
var lastCell = -1;

var checkedShields = false; //check shield stats on script start
var highCritChance;
var highCritDamage;
var highATK;
var highPB;
var lowCritChance;
var lowCritDamage;
var lowATK;
var lowPB;
var lowShieldName = "LowDmgShield"; //edit these to change the names used (visual only).
var highShieldName = "HighDmgShield";
var wantGoodShield = true; //we want to only swap shield maximum once per loop
var goodBadShieldRatio = 1;

var lastFluffXp = -1;
var lastFluffDmg = 1;

var currMap;
var statusMsg = "";
var ASMode;

var ATmakeUp = false;

function pauseRemovalLoop(){
   if(!getPageSetting('PauseMsgsVisible')){
        var pauseMsgs = document.getElementsByClassName('pauseMsg');
        var log = document.getElementById('log');
        for (var x = 0; x < pauseMsgs.length; x++)
           log.removeChild(pauseMsgs[x]);
   }
}

////////////////////////////////////////
//Main LOGIC Loop///////////////////////
////////////////////////////////////////
////////////////////////////////////////
//makeUp = true when game is in catchup mode, so we can skip some unnecessary visuals
function ATLoop(makeUp) {
    
    //console.log(requestCounter + " " + (requestCounter-requestCounterLast));
    //requestCounterLast = requestCounter;
    
    if (ATrunning == false) return;
    if(getPageSetting('PauseScript') || game.options.menu.pauseGame.enabled || game.global.viewingUpgrades) {
        if(getPageSetting('PauseScript'))
            updateAutoMapsStatus("", "AT paused", true);
        return;
    }
    ATrunning = true;
    ATmakeUp = makeUp;
    var AS = getPageSetting('AutoStance');
    if(AS < 2)       ASMode = "Advancing";
    else if(AS == 2) ASMode = "DE";
    else             ASMode = "Push";
    statusMsg = ASMode;
    
    if(game.options.menu.showFullBreed.enabled != 1) toggleSetting("showFullBreed");    //more detail
    hiddenBreedTimer = ((game.jobs.Amalgamator.owned > 0) ? Math.floor((getGameTime() - game.global.lastSoldierSentAt) / 1000) : Math.floor(game.global.lastBreedTime / 1000));
    if(hiddenBreedTimer != hiddenBreedTimerLast && typeof addbreedTimerInsideText !== 'undefined'){
        addbreedTimerInsideText.textContent = hiddenBreedTimer + 's'; //add breed time for next army;
        hiddenBreedTimerLast = hiddenBreedTimer;
    }
    addToolTipToArmyCount(); //Add hidden tooltip for army count (SettingsGUI.js @ end)
    if (mainCleanup() // Z1 new world
            //|| portalWindowOpen // if we want this functionality, we can hookin to the activate portal btn. i just dont know that we do.
            || (!heirloomsShown && heirloomFlag) // closed heirlooms screen
            || (heirloomCache != game.global.heirloomsExtra.length)) { // inventory size changed (a drop appeared)
            // also pre-portal: portal.js:111
        if (getPageSetting('AutoHeirlooms')) autoHeirlooms(); //"Auto Heirlooms" (heirlooms.js)
        //if (getPageSetting('AutoUpgradeHeirlooms') && !heirloomsShown) autoNull();  //"Auto Upgrade Heirlooms" (heirlooms.js)

        heirloomCache = game.global.heirloomsExtra.length;
        highestPrestigeOwned = 0;
    }
    heirloomFlag = heirloomsShown;
    
    if(!checkedShields){
        equipLowDmgShield();
        equipMainShield();
        checkedShields = true;
    }
    
    //Stuff to do Every new Zone
    if (aWholeNewWorld) {
        // Auto-close dialogues.
        switch (document.getElementById('tipTitle').innerHTML) {
            case 'The Improbability':   // Breaking the Planet
            case 'Corruption':          // Corruption / True Corruption
            case 'Spire':               // Spire
            case 'The Magma':           // Magma
                cancelTooltip();
        }
        if (getPageSetting('AutoEggs'))
            easterEggClicked();
        setTitle(); // Set the browser title
        buildWorldArray();
        setEmptyStats(); //also clears graph data
        
        lastCell = -1;
        lastFluffXp = -1;
        lastFluffDmg = 1;
        AutoMapsCoordOverride = false;
        maxCoords = -1;
        perked = false;
    }
    setScienceNeeded();  //determine how much science is needed
    
    maxAnti = (game.talents.patience.purchased ? 45 : 30);
    if(game.global.mapsActive) currMap = getCurrentMapObject();
    if (Fluffy.isActive() && lastFluffXp != Fluffy.currentExp[1]){
        lastFluffXp = Fluffy.currentExp[1];
        lastFluffDmg = Fluffy.getDamageModifier();
    }

    //EXECUTE CORE LOGIC
    if (getPageSetting('ExitSpireCell') >0 || getPageSetting('ExitSpireCellDailyC2') >0) exitSpireCell(); //"Exit Spire After Cell" (other.js)
    //if (getPageSetting('loomprotect') == true) protectloom(); //"Exit Spire After Cell" (other.js)

    if (getPageSetting('AutoAllocatePerks')==2) lootdump(); //Loot Dumping (other.js)
    if (getPageSetting('BuyUpgradesNew') != 0) buyUpgrades();                                //"Buy Upgrades"       (upgrades.js)         
    
    var agu = getPageSetting('AutoGoldenUpgrades');
    if (agu && agu!='Off') autoGoldenUpgradesAT(agu);                                       //"Golden Upgrades"     (other.js)
    if (getPageSetting('BuyBuildingsNew')===0);                                            //"Buy Neither"              (Buildings.js)
      else if (getPageSetting('BuyBuildingsNew')==1) { buyBuildings(); buyStorage(); }      //"Buy Buildings & Storage"  (")
      else if (getPageSetting('BuyBuildingsNew')==2) buyBuildings();                      //"Buy Buildings"            (")
      else if (getPageSetting('BuyBuildingsNew')==3) buyStorage();                        //"Buy Storage"              (")
    if (getPageSetting('BuyJobsNew')>0) buyJobs();                                              
    if (getPageSetting('ManualGather2')) manualLabor();  //"Auto Gather/Build"       (gather.js)
     
    autoMap(); //automaps() is in charge of maps combat
    updateAutoMapsStatus("", statusMsg, true); //update status

    if (autoTrimpSettings.AutoPortal.selected != "Off") autoPortal();   //"Auto Portal" (hidden until level 40) (portal.js)
    
    if (getPageSetting('TrapTrimps') && game.global.trapBuildAllowed && game.global.trapBuildToggled == false) toggleAutoTrap(); //"Trap Trimps"
    if (aWholeNewWorld && getPageSetting('AutoRoboTrimp')) autoRoboTrimp();   //"AutoRoboTrimp" (other.js)
    if (aWholeNewWorld && getPageSetting('FinishC2')>0 && game.global.runningChallengeSquared) finishChallengeSquared(); // "Finish Challenge2" (other.js)
    
    if (getPageSetting('AutoStance')>0) autoStance();    //autostance() is in charge of world combat
    equipSelectedShield(wantGoodShield);
    //if (getPageSetting('UseScryerStance'))  useScryerStance();  //"Use Scryer Stance"   (scryer.js)
    
    if (getPageSetting('UseAutoGen')) autoGenerator();          //"Auto Generator ON" (magmite.js)
    //ATselectAutoFight();  //  pick the right version of Fight/AutoFight/BetterAutoFight/BAF2 (fight.js)       //<--------- remove the settings
    var forcePrecZ = (getPageSetting('ForcePresZ')<0) || (game.global.world<getPageSetting('ForcePresZ'));                                                      //dagger push etc
    if (getPageSetting('DynamicPrestige2')>0 && forcePrecZ) prestigeChanging2(); //"Dynamic Prestige" (dynprestige.js)                                          //dagger push etc
    else autoTrimpSettings.Prestige.selected = document.getElementById('Prestige').value; //just make sure the UI setting and the internal setting are aligned. //dagger push etc
    if (getPageSetting('AutoMagmiteSpender2')==2 && !magmiteSpenderChanged)  autoMagmiteSpender();   //Auto Magmite Spender (magmite.js)
    if (getPageSetting('AutoNatureTokens')) autoNatureTokens();     //Nature     (other.js)
    //
    //Runs any user provided scripts, see line 254 below
    if (userscriptOn) userscripts();
    //
    //rinse, repeat, done
    
    return;
}

//GUI Updates happen on this thread, every 1000ms
function guiLoop() {
    updateCustomButtons();
    MODULESdefault = JSON.parse(JSON.stringify(MODULES));
    //Store the diff of our custom MODULES vars in the localStorage bin.
    safeSetItems('storedMODULES', JSON.stringify(compareModuleVars()));
    //Swiffy UI/Display tab
    if(getPageSetting('EnhanceGrids'))
        MODULES["fightinfo"].Update();
    if(typeof MODULES !== 'undefined' && typeof MODULES["performance"] !== 'undefined' && MODULES["performance"].isAFK)
        MODULES["performance"].UpdateAFKOverlay();
}

//reset stuff that may not have gotten cleaned up on portal
function mainCleanup() {
    lastrunworld = currentworld;
    currentworld = game.global.world;
    aWholeNewWorld = lastrunworld != currentworld;
 
    //run once per portal:
    if (currentworld == 1 && aWholeNewWorld) {
        lastHeliumZone = 0;
        zonePostpone = 0;
        amalgamatorsCounter = 0;
        firstTime = true;
        //for the dummies like me who always forget to turn automaps back on after portaling
        if(getPageSetting('AutoMaps')==1 && !game.upgrades.Battle.done && getPageSetting('AutoMaps') == 0)
            settingChanged("AutoMaps");
        return true; // Do other things
    }
}

// Userscript loader. write your own!
//Copy and paste this function named userscripts() into the JS Dev console. (F12)
var userscriptOn = true;    //controls the looping of userscripts and can be self-disabled
var globalvar0,globalvar1,globalvar2,globalvar3,globalvar4,globalvar5,globalvar6,globalvar7,globalvar8,globalvar9;
//left blank intentionally. the user will provide this. blank global vars are included as an example
function userscripts()
{
    //insert code here:
}

//test.
function throwErrorfromMain() {
    throw new Error("We have successfully read the thrown error message out of the main file");
}

//Magic Numbers
var runInterval = 100;      //How often to loop through logic

startAT();