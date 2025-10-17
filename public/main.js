//NOTES
//https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=241134&type=card This is an example url that can retrieve the image of the card. The id can be retrieve from the url the user inputs
//There is an api for magic and it can be installed through npm but i dont know how id get it to work on client side so instead we'll just interact with the api the raw way | https://api.magicthegathering.io/<version>/<resource>
//LINK TO API: https://docs.magicthegathering.io/#documentationgetting_started
//Example of Raw API Call: https://api.magicthegathering.io/v1/cards/240134 [Equisite Blood]

//Good to know | https://css-tricks.com/random-numbers-css/



window.addEventListener("load", function () {
  
  //Apply Event Listeners
  document.getElementById("add-new-pack").addEventListener("click", Panel.openNew ) //'Create New Pack' Button
  document.getElementById("open").addEventListener("click", openPack)
  document.getElementsByClassName("done-btn")[0].addEventListener("click", Panel.close) //'Save pack' Button
  document.addEventListener("paste", function (e) { console.log(e); handleInput(e.clipboardData.getData("Text") || window.clipboardData.getData("Text")) })//https://stackoverflow.com/questions/2176861/javascript-get-clipboard-data-on-paste-event-cross-browser
  document.addEventListener('drop', handleDrop, false);//https://stackoverflow.com/questions/36548805/adding-eventlistener-for-file-drop
  document.addEventListener("dragover", handleDragOver, false);
  document.addEventListener("dragend", handleDragEnd, false);
  
  //Menu Nav Buttons
  document.getElementById("nav-details").addEventListener("click", function (e){ Panel.changeMenu("details-view") })
  document.getElementById("nav-list").addEventListener("click", function (e){ Panel.changeMenu("list-view") })
  document.getElementById("nav-cards").addEventListener("click", function (e){ Panel.changeMenu("cards-view") })

  //Title & Subtitle Input Updates
  document.getElementById("title-input").addEventListener("input", Panel.updateDisplay)
  document.getElementById("subtitle-input").addEventListener("input", Panel.updateDisplay)
  

  populatePacks();

  
  window.addEventListener("mousemove", function (e) {
    
    var background = document.getElementById("background")
    background.style["background-position-y"] = ((window.innerHeight/2 - e.clientY)/50) + "px"
    background.style["background-position-x"] = "calc( 50% + " +  ((window.innerWidth/2 - e.clientX)/50) + "px )"

  })
  
  
  
})

function openPack (e){
  
  
  //Get Pack ID
  var packId = document.getElementById("pack-slot").getAttribute("packId")
  if ( !(packId in PACKS) ){ return; }//If PackId Is Not Registered, Dont Open
  
  var open = document.getElementById("open")
  var overlay = document.getElementById("MainOverlay")
  var container = document.getElementsByClassName("pack-container")[0]
  var background = document.getElementById("background")
  var slot = document.getElementById("pack-slot")
  
  //Move Extra UI Out Of The Way
  overlay.style["transform"] = "translate(0px, -100%)";
  container.style["transform"] = "translate(0px, 200%)";
  open.style["transform"] = "translate(0px, 500%)";
  background.style["transform"] = "scale(1.1)"
  background.style["transition"] = "background-position 4s, transform 2s"

  
  function handleInteract (e) {
    
    //When You Click Move Any Flipped Cards Offscreened So They Dont Overlap Other Cards
    var _flipped = slot.querySelectorAll(".card.flipped:not(.offscreened)")
    if ( _flipped.length > 0 ){ 
      
      _flipped[0].className = "card offscreened"
      if (slot.querySelectorAll(".card:not(.flipped):not(.offscreened)").length == 0)
      { resetView() }
                           
    }

    //Searches For The Flipped Class
    var isFlipped = e.target.className.indexOf("flipped") != -1
    var isOffscreened = e.target.className.indexOf("offscreened") != -1
    
    //If The Card Is Flipped Over Then The Card Should Be Moved Offscreen
    if ( isFlipped ){ 
      
      //Remove From View
      e.target.className = "card offscreened"
      
      //If This is The Last One Reset The UI
      if (slot.querySelectorAll(".card:not(.flipped):not(.offscreened)").length == 0)
      { resetView() }
      
    }
    //If The Card Isnt Flipped And On Screen Then The Card Should Be Flipped
    else if ( !isOffscreened ){ e.target.className = "card flipped" }
    
    
  }
  
  function resetView(){
    
    overlay.style["transform"] = "";
    container.style["transform"] = "";
    open.style["transform"] = "";
    background.style["transform"] = ""
    
    //Remove pack Id From Slot Attributes
    document.getElementById("pack-slot").setAttribute("packId", "")
  }
  
  

  
  //Summon Cards
  const CARD_COUNT = 2;
  for ( var i = 0; i < CARD_COUNT; i++){
    
    var id = Pack.gacha( packId )
    
    var card = new Card(id).asElement()
    card.addEventListener("click", handleInteract)
    card.className = "card"
    slot.appendChild(card)
    
  }

  slot.children[0].style["-webkit-animation"] = "open 1s cubic-bezier(0.65, 0, 1, 1) 1"
  //slot.children[0].style["opacity"] = "0%";
  slot.children[0].style["visibility"] = "hidden";
}


//Image Drop 
async function handleDrop(e) {

  e.stopPropagation();
  e.preventDefault();
  
  console.log(e.dataTransfer.files)
  document.getElementById("pack-drop-area").style["opacity"] = "0%";//Hiding Drop Area indicator
  document.getElementById("image-drop").style["opacity"] = "0%";  
  
  var isPackID = e.dataTransfer.types[0] == "text/packid"
  var dropArea = document.getElementById("pack-drop-area")

  if ( e.target == dropArea && isPackID ){
    
    var ID = e.dataTransfer.getData("text/packid")//https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/getData
    PackDisplay.displayInSlot(ID)
    
  }
  
  //If The Drop Contains A File
  if ( e.dataTransfer.files[0] != undefined ){
    
    //Check If Its A .Pak File Thats Dropped In The Right Area
    var n = e.dataTransfer.files[0].name
    if ( n.length > 4 && n.substring( n.length -4, n.length).indexOf(".pak") != -1 && e.target == dropArea){

      //Read The Octet Stream It Comes In As As Plain Text, Convert To Json By Parsing || https://stackoverflow.com/questions/55284771/how-to-read-blob-octet-stream-to-json-object
      var reader = new FileReader();

      //When Reading Complete
      reader.addEventListener('load', function (n) {

        //Parse Pack Data To Be Readable
        var packArr = JSON.parse(n.target.result)

        //Fix Image SRC If It is A URL
        if ( packArr[0].indexOf("http://") == 0 || packArr[0].indexOf("https://") == 0 ){
          console.log("is URL")
          packArr[0] = "url(" + packArr[0] + ")"
        }

        //Create A New Pack Object And Give It A Place In The PACKS Dict
        var pack = new Pack( packArr[0], packArr[1], packArr[2], packArr[3] )
        var id = Database.appendPack( pack, PACKS )
        populatePacks()
        PackDisplay.displayInSlot( id )


      });

      //Initiate Reading
      reader.readAsText(e.dataTransfer.files[0]);

    }

    
    
    //Check If it Is An Image File
    var type = e.dataTransfer.files[0].type
    var imageDropArea = document.getElementById("image-drop")
    if ( type.indexOf("image/") != -1 && e.target == imageDropArea ){ //If It Has An Image Type And is Targeting The Drop Area
      
      //Image Load | https://stackoverflow.com/questions/33855167/convert-data-file-to-blob
      var reader = new FileReader();
      reader.addEventListener('load', function (n) { PACKS[_PackId].src = "url(" + n.target.result  + ")"; Panel.updateDisplay() });
      reader.readAsDataURL(e.dataTransfer.files[0]);

      
    }
    //If It Is An Image File

    
    
    
  }
  
  

  
}

function handleDragOver (e){
  event.preventDefault();
  
  //var isPackID = e.dataTransfer.types[0] == "text/packid"
  var dropArea = document.getElementById("pack-drop-area")
  
  //Turn White If Correct Data Type is Hovered Over
  if ( e.target == dropArea ){ 
    dropArea.style["border-color"] = "white"; 
    dropArea.style["opacity"] = "50%"; 
  }
  //Turn Off When Not Hovered over
  else { dropArea.style["opacity"] = "0%"; }
  
  
  var imageDropArea = document.getElementById("image-drop")
  if ( e.target == imageDropArea ){ 
    imageDropArea.style["border-color"] = "white"; 
    imageDropArea.style["opacity"] = "80%"; 
  }
  //Turn Off When Not Hovered over
  else { imageDropArea.style["opacity"] = "0%"; }
  
}


function handleDragEnd (e){
  
  document.getElementById("pack-drop-area").style["opacity"] = "0%";
}




class Database {  
  
  static generateID( packs ){
    
    var id = Math.floor( Math.random() * 999999 )
    while ( Object.keys( packs ).indexOf(id) != -1 )//Continually generate Until The Code Is Unique
    { id = Math.floor( Math.random() * 999999 ); console.log("Key Generated: " + id ) } //IF ID Already Exists, Generate A New One
    return id;
    
  }
  
  static exportPack( pack ){
    
    //https://stackoverflow.com/questions/13405129/create-and-save-a-file-with-javascript
    //https://developer.mozilla.org/en-US/docs/Web/API/Blob
    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
    
    //So blobs seem like the universal go to for files
    
    //Lets turn our data into JSON for easy parsing
    var json = JSON.stringify( [ pack.src, pack.title, pack.type, pack.cards ] )
    var file = new Blob([json], {type: "text/json"})
    var url = URL.createObjectURL( file )
    
    //We can only download things through clicking a button apparently
    var a = document.createElement("a")
    a.href = url
    a.download = pack.title.replace(" ", "_") + ".pak" //Custom File Format That Will Be Written As An Octet Stream Apparently
    document.body.appendChild(a)
    a.click()
    a.remove()
    
  }
  
  static appendPack( pack, packsDict ){
    
    var id = Database.generateID( packsDict )
    packsDict[id] = pack
    return id
    
  }

  
}

class Pack {
  
  constructor( imgURL, title, type, cards ){
    
    this.src = imgURL || "https://media.discordapp.net/attachments/512736380699410474/1128139841222213713/wp7585076.png?width=250&height=401";
    this.title = title || "";
    this.type = type || "";
    this.cards = cards || {};

  }
  
  //A Function Which Returns The ID Of A Pseudo Random Card
  static gacha( packId ){
    
    const rand = Math.random(); // [0 through 1)
    const mChance = 0.07;//7%
    const rChance = 0.10;//10%
    const uChance = 0.36;//36%
    const cChance = 0.47;//47%
    var rarity = "Common";
    
    //Get Rarity
    if ( 0 <= rand && rand < mChance ){ rarity = "Mythic"; }//Mythical Draw
    else if ( mChance <= rand && rand < rChance + mChance ){ rarity = "Rare"; }//Rare Draw
    else if ( rChance + mChance <= rand && rand < uChance + rChance + mChance){ rarity = "Uncommon"; }//Uncommon Draw
    else if ( uChance + rChance + mChance <= rand && rand < cChance + uChance + rChance + mChance ){ rarity = "Common"; }//Common Draw
    
    console.log(rand)
    console.log(rarity)
    
    //console.log(packId)
    var poolKeys = Object.keys( PACKS[parseInt(packId,10)].cards[rarity] || {} ) || []
    var poolSize = poolKeys.length 
    if ( poolSize < 1 ){ return "000000"}//This leads To An Image of The back Of The Card
    
    var cardNum = Math.floor( Math.random() * poolSize )
    return poolKeys[ cardNum ]
    
  }
  
}






//PANEL FUNCTIONS
class Panel{
  
  static open() {
  
    //Update pID On Panel
    document.getElementById("id-number").innerText = "pID: " + _PackId
    
    
    if ( _PackId != undefined ){ List.populate( _PackId ) }
    var title = document.getElementById("title-input")
    var subtitle = document.getElementById("subtitle-input")
    title.value = PACKS[_PackId].title
    subtitle.value = PACKS[_PackId].type
    Panel.updateDisplay()
    Panel.playOpeningAnimation()
    
    
    
  
  }
  
  static openNew() {
    
    _PackId = Database.generateID( PACKS )
    PACKS[_PackId] = new Pack()
    Panel.open()
  
  }


  static close() {


    populatePacks()
    console.log(PACKS)
    
    
    var panel = document.getElementById("panel")
    var darkness = document.getElementById("darken-background")

    panel.style.visibility = "hidden"
    //panel.style.width = "0px"
    panel.style.opacity = "0%"

    darkness.style.visibility = "hidden"
    darkness.style.opacity = "0%"
    darkness.style.transition = " visibility 1s, opacity 1s "

  }
  
  
  
  static changeMenu( id ){
    
    const valid = ["details-view", "list-view", "cards-view"]
    var isValid = valid.indexOf(id) != -1
    if (!isValid ){ return }
    var newMenu = document.getElementById(id)
    var oldMenu = document.getElementsByClassName("current-menu")[0]
    
    //Set Display And Remove Current-Menu Class
    oldMenu.style.display = "none"
    oldMenu.style.opacity = "0%"
    oldMenu.className = oldMenu.className.replace("current-menu", "") 
    
    //Set Display And Add Current-Menu Class
    newMenu.style.transition = "opacity 2s"
    newMenu.style.opacity = "100%"
    newMenu.style.display = "flex"
    newMenu.className = newMenu.className + " current-menu" 
    
    //Find Proper Nav Buttons
    var newNav;
    var oldNav = document.getElementsByClassName("current-nav")[0]
    switch ( id ){
        
        case "details-view" : { newNav = document.getElementById("nav-details"); break; }
        case "list-view" : { newNav = document.getElementById("nav-list"); break; }
        case "cards-view" : { newNav = document.getElementById("nav-cards"); break; }
        default: return;
        
    }
    
    //Set Classname Of Old
     oldNav.className = oldNav.className.replace("current-nav", "") 
    
    //Set New Nav Classname To Current-Nav
    newNav.className = newNav.className + " current-nav" 

    
  }
  

  
  static updateDisplay(){
    
      //Get Data And Display Elements
      var title = document.getElementById("title-input").value
      var subtitle = document.getElementById("subtitle-input").value
      var titleDisp = document.getElementById("title-display")
      var subtitleDisp = document.getElementById("subtitle-display")
      
      //Set Display Elements To Equal The Input
      titleDisp.innerText = title
      subtitleDisp.innerText = subtitle
    
      //Update Current Pack Information
      PACKS[_PackId].title = title
      PACKS[_PackId].type = subtitle 
    
      //Get Image Fton Pack Data And Update
      var src = PACKS[_PackId].src
      document.getElementById("main-display").style["background-image"] = src;
      console.log(document.getElementById("main-display").style["background-image"])
    
  }
  
  
  static playOpeningAnimation(){
    var panel = document.getElementById("panel")
    var darkness = document.getElementById("darken-background")

    panel.style.visibility = "visible"
    panel.style.opacity = "100%"
    panel.style.transition = " all 0.1s"

    darkness.style.visibility = "visible"
    darkness.style.opacity = "100%"
    darkness.style.transition = " visibility 0s, opacity 1s "
  }
  
}




const handleInput = async function (input) {
  

    //Show loading Screen
    List.showLoading(true)
  
  
    var ids = input.split(" ")
    for ( var n = 0; n < ids.length; n++ ){
        
        if ( ids[n].length > 6 || ids[n].match(/[^0-9]/i) != null ){ continue; }//If ID Has More Then Six Characters Or Has Characters Other Than Numbers
        var response = await Card.getData(ids[n])
        var cardObject = new CardObject( response.card.multiverseid, response.card.name, response.card.rarity)
        new ListItem( cardObject )
        console.log(response)
      
    }

  
  
    //Hide loading Screen
    List.showLoading(false)
  
    //Add To Current Pack Data
    //if ( PACKS[_PackId].cards[response.card.rarity] == undefined ){ PACKS[_PackId].cards[response.card.rarity] = {}; PACKS[_PackId].cards[response.card.rarity][response.card.multiverseid] = {} }  
    //PACKS[_PackId].cards[response.card.rarity][response.card.multiverseid]["name"] = response.card.name
    //PACKS[_PackId].cards[response.card.rarity][response.card.multiverseid]["type"] = response.card.type
    //PACKS[_PackId].cards[response.card.rarity][response.card.multiverseid]["number"] = response.card.number
  


}













const populatePacks = function () {
  
  //Delete All Containers
  var containers = document.getElementsByClassName("pack-retainer")
  var length = containers.length
  
  var n = 0;
  for ( var i = 0; i < length; i++)
  { containers[0].style.background = "white"; containers[0].remove() }
  
  for (const [id, pack] of Object.entries(PACKS)) {
            
    console.log(pack)
    new PackDisplayContainer( pack.src, pack.title, pack.type, id )
  }
  
}






class PackDisplay {

  
  constructor( src, title, type ){
    
    console.log("packdisplay: " + src)
    this.imageDisplay = document.createElement("div");
    this.imageDisplay.className = "Pack-Display";
    
    this.textContainer = document.createElement("div");
    this.textContainer.className = "Pack-Text-Display"
    this.imageDisplay.appendChild( this.textContainer );
    
    this.titleDisplay = document.createElement("h1");
    this.titleDisplay.className = "Pack-Title-Display"
    this.textContainer.appendChild( this.titleDisplay );
    
    this.typeDisplay = document.createElement("h2")
    this.typeDisplay.className = "Pack-Type-Display"
    this.textContainer.appendChild( this.typeDisplay );

    
    this.src = src || "";
    this.title = title || "";
    this.type = type || "";
    
    
  }
  
  
  //When This Objects SRC Gets Set, Set The Div Elements Background Image
  set src( val ){ this.imageDisplay.style["background-image"] = val; console.log("set" + val); console.log(this.imageDisplay) }
  
  //When This Objects Title Gets Set, Set The H1 Elements Text
  set title( val ){ this.titleDisplay.innerText = val; }
  
  //When This Objects Type Gets Set, Set The H2 Elements Text
  set type( val ){ this.typeDisplay.innerText = val; }
  
  
  
  //Return As Element
  asElement(){
    return this.imageDisplay;
  }
  
  static fromID( ID ){
    
    console.log(PACKS[ID].src)
    return new PackDisplay( PACKS[ID].src, PACKS[ID].title, PACKS[ID].type )
    
  }
  
  static displayInSlot( ID ){
    
    if ( !Number.isInteger(ID)  ){ ID = parseInt(ID,10) }
    var slot = document.getElementById("pack-slot")
    
    //Create New Pack Display
    var displayElement = PackDisplay.fromID( ID ).asElement();
    var children = slot.children.length
    for ( var i = 0; i < children; i++ ){ console.log(slot.children[0]); slot.children[0].remove() }//Empty Slot
    displayElement.className = "Pack-Display"
    displayElement.style["width"] = "190px";
    displayElement.style["height"] = "291px";
    displayElement.style["-webkit-animation"] = "hovering 4s ease-in-out infinite, appear 1s cubic-bezier(0.94, -0.49, 0.26, 0.85) 1";
    slot.append( displayElement )
    

    //Set The Pack Id Attribute On The Pack Slot Element To Reference Later By The Open Button
    document.getElementById("pack-slot").setAttribute("packId", ID.toString() )

    
  }
  
}

class PackDisplayContainer {

  constructor( src, title, type, id ){
    
    
    
    this.id = id || "000000";
    
    
    this.mainContainer = document.createElement("div");
    this.mainContainer.className = "pack-retainer draggable";
    this.mainContainer.draggable = "true";
    
    var _main = this.mainContainer;
    this.mainContainer.addEventListener('dragstart', function (e) {
      
      //https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/setDragImage
      var img = new Image()
      img.src = "https://cdn.glitch.global/6bfacd18-ec68-4393-a3a2-e5f2ff1f6c1b/NewCardTemplate.png?v=1689453582854"
      e.dataTransfer.setDragImage(img, 40, 20);
      e.dataTransfer.setData("text/packID", id.toString() );//Give A Type To Identify The Data By
      _main.style["background"] = "radial-gradient(#0000001c 30%, #ffffff2e)"
      _main.style["opacity"] = "20%";
      
    });
    
    this.mainContainer.addEventListener('dragend', function (e) {
      
      _main.style["background"] = ""
      _main.style["opacity"] = "";
      
    });
    
    
    document.getElementsByClassName("packs")[0].appendChild( this.mainContainer );
    
 
    
    this.textContainer = document.createElement("div");
    this.textContainer.className = "pack-retainer-text-box"
    this.mainContainer.appendChild( this.textContainer );
    
    
    this.titleDisplay = document.createElement("h1");
    this.titleDisplay.className = "pack-retainer-title"
    this.textContainer.appendChild( this.titleDisplay );
    
    this.typeDisplay = document.createElement("h2")
    this.typeDisplay.className = "pack-retainer-type"
    this.textContainer.appendChild( this.typeDisplay );
    
    this.outerBtnContainer = document.createElement("div")
    this.outerBtnContainer.className = "outer-btn-container"
    this.textContainer.appendChild( this.outerBtnContainer );
    
    this.innerBtnContainer = document.createElement("div")
    this.innerBtnContainer.className = "inner-btn-container"
    this.outerBtnContainer.appendChild( this.innerBtnContainer );
    
        
    this.export = document.createElement("button")
    this.export.className = "export-btn"
    this.export.addEventListener("click", function (e) { Database.exportPack( PACKS[id] ) })//Save File When Clicked
    this.innerBtnContainer.appendChild( this.export );
    
    this.config = document.createElement("button")
    this.config.className = "config-btn"
    this.config.addEventListener("click", function (e) { _PackId = id; Panel.open() })
    this.innerBtnContainer.appendChild( this.config );

    
    var _this = this
    this.delete = document.createElement("button")
    this.delete.className = "delete-btn"
    this.delete.addEventListener("click", function (e) { PackDisplayContainer.remove(_this) })
    this.outerBtnContainer.appendChild( this.delete );
    
    console.log("in packdisplaycontainer: " + src)
    this.PackObject = new PackDisplay( src, "", "" );
    this.PackElement = this.PackObject.asElement();
    this.PackElement.style["width"] = "59px";
    this.PackElement.style["height"] = "98px";
    this.PackElement.style["margin"] = "25px";
    this.mainContainer.appendChild( this.PackElement );
    
    this.src = src || "";
    this.title = title || "NAMELESS";
    this.type = type || " 2-Card Booster Pack ";
    
    
  }
  
  set title( val ){ this.titleDisplay.innerText = val; }
  set type( val ){ this.typeDisplay.innerText = val; }
  
  static remove(_this){
    
    console.log(_this)
    _this.mainContainer.remove()//Delete List Element
    delete PACKS[_this.id]
    populatePacks()
    
  }
  
}





class Card {
  
  constructor( id ){
    this.card = document.createElement("div")
    this.card.className = "card"
    this.card.style["background-image"] = "url(https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=" + id + "&type=card)"
    console.log(this.card)
  }
  
  static async getData( ID ) {

    var sendTo = "https://api.magicthegathering.io/v1/cards/" + ID
    var data = await fetch(sendTo)
    return await data.json()

  }
  

  
  asElement(){
    return this.card;
  }
  
}





class ListItem {
  

  
  constructor( cardObject ){
    
      var RARITY_ICON_PAIRS = {
        "Common" : "https://cdn.glitch.global/735a4e5a-c099-408d-9e34-1b0af9497952/CommonIndicator.png?v=1689008818050",
        "Uncommon" : "https://cdn.glitch.global/735a4e5a-c099-408d-9e34-1b0af9497952/UncommonIndicator.png?v=1689008804452",
        "Rare" : "https://cdn.glitch.global/25ff019e-74eb-411a-884f-8a6625f40a76/RareIndicatorOutline.png?v=1689957801722",
        "Mythic" : "https://cdn.glitch.global/25ff019e-74eb-411a-884f-8a6625f40a76/MythicIndicatorOutline.png?v=1689957817164"
        
      }
    
      this.rarity = cardObject.rarity
      this.name = cardObject.name
      this.id = cardObject.id
      this.card = cardObject
    
      this.node = document.createElement("li")
      this.node.className = "listItem"


      var rarityIndicator = document.createElement("img")
      rarityIndicator.className = "IndicatorSpace"
      rarityIndicator.src = RARITY_ICON_PAIRS[this.rarity]
      this.node.appendChild(rarityIndicator)

      var nameSpace = document.createElement("div")
      nameSpace.className = "NameSpace"
      nameSpace.innerText = this.name
      this.node.appendChild(nameSpace)


      var _this = this;
      var removeBTN = document.createElement("button")
      removeBTN.className = "remove-btn"
      removeBTN.innerText = "remove"
      removeBTN.addEventListener("click", function(e){ ListItem.removeFromList(_this) })
      this.node.appendChild(removeBTN)
    
      this.addToList()
      
  }
  
  static removeFromList(_this){
    
    _this.node.remove()//Delete List Element
    
    //Create Placeholder If Neccessary
    const AMOUNT = 5;
    var list = document.getElementById("CardList")
    var placeholders = document.getElementsByClassName("placeholder-item")
    var placeholderCount = placeholders.length
    for ( var i = 0; i < AMOUNT - placeholderCount; i++ )
    { list.appendChild( List.createPlaceHolder() ) }
    
    //Delete From Pack ||| delete keyword???
    console.log(PACKS[_PackId])
    delete PACKS[_PackId].cards[_this.rarity][_this.id]
    console.log(PACKS[_PackId])
    
  }
  
  addToList(){
    
    var list = document.getElementById("CardList")

  
    //Replace A Placeholder If Possible
    var placeholder = document.getElementsByClassName("placeholder-item")
    if ( placeholder[0] != undefined) { list.insertBefore( this.node, placeholder[0]); placeholder[0].remove() }
    else { list.appendChild(this.node) }
    
    //Add It To The Current Pack
    if ( PACKS[_PackId].cards[this.rarity] == undefined ) { PACKS[_PackId].cards[this.rarity] = {} }
    PACKS[_PackId].cards[this.rarity][this.id] = this.card
    
  }
  
}



class List {
  
  static showLoading( bool ){
    
    if (bool){
      
      //Reveal Loading Screen
      document.getElementById("Loading").style.opacity = "90%"
      document.getElementById("Loading").style.visibility = "visible"
    
    }
    else {
          
      //Hide Loading Screen
      document.getElementById("Loading").style.opacity = "0%"
      document.getElementById("Loading").style.visibility = "hidden" //Has to be hidden so i can click through it

    }
    
  }
  
  static createPlaceHolder(){
    var placeholder = document.createElement("li")
    placeholder.className = "placeholder-item"
    return placeholder
  }
  
  
  static populate( packId ){
    
    //Delete Old List Items
    var items = document.getElementsByClassName("listItem")
    var itemCount = items.length
    for ( var i = 0 ; i < itemCount; i++  )
    { items[0].remove(); }
    
    
    //Add Back PlaceHolders
    const AMOUNT = 5;
    var list = document.getElementById("CardList")
    var placeholders = document.getElementsByClassName("placeholder-item")
    var placeholderCount = placeholders.length
    for ( var i = 0; i < AMOUNT - placeholderCount; i++ )
    { list.appendChild( List.createPlaceHolder() ) }
    
    
    
    //Generate New List Items
    var cards = PACKS[packId].cards
    var rarities = [ cards.Mythic, cards.Rare, cards.Uncommon, cards.Common ]
    for ( var i = 0 ; i < 4; i++ ){
      if ( rarities[i] == undefined ) { continue; }
      for (const [id, card] of Object.entries( rarities[i] )) {
   
          new ListItem( card )
      
      }
    }
  }
  
  
  
  
}





class CardObject {
  
  constructor( id, name, rarity){
    
    this.name = name
    this.id = id
    this.rarity = rarity
    
  }
  
  static async fromID( ID ){
    
    var sendTo = "https://api.magicthegathering.io/v1/cards/" + ID
    var data = await fetch(sendTo)
    var json = await data.json()
    console.log(json)
    return new CardObject( )
    
  }
  
}




//Where We Wiil Store The Different Packs
var PACKS = {}
var _PackId = 999999;//Current Pack Id

