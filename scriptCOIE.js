const versionCOIE = 1.0;
var scriptCOIELoad = false;

var getCleanImgsrc = function (imgsrc) {
   var parts = imgsrc.match(/(.*\/images\/.*)(thumb|med|original|max)([^\?]*)(\?[^?]+)?$/);
   if(parts) {
      return parts[1]+'thumb'+parts[3]+(parts[4]?parts[4]:`?${Math.round(Math.random()*9999999)}`);
   }
   return;
};

var scriptCOIE = scriptCOIE || {
    
    exportCharacter(msg) {
        var allCharacter = [];
        var cpt = 0;
        _.each(msg.selected, function(selected){
            const newCharacter = getObj("character", getObj(selected._type, selected._id).get('represents'));
            if(newCharacter !== undefined){
                var character = ({
                    _name: newCharacter.get("name"),
                    _avatar: newCharacter.get("avatar"),
                    _attributes: [],
                    _abilities: []
                })
                newCharacter.get("bio", function(bio){
                    if (bio.length > 0 && bio != 'null') character._bio = encodeURIComponent(bio);
                    newCharacter.get("gmnotes", function(gmnotes){
                        if (gmnotes.length > 0 && gmnotes != 'null') character._gmnotes = encodeURIComponent(gmnotes);
                        var attributesCharacter = findObjs({_type: "attribute", _characterid: newCharacter.get("_id")});
                        _.each(attributesCharacter, function(attribute){
                            character._attributes.push({
                                _name: attribute.get("name"),
                                _current: attribute.get("current"),
                                _max: attribute.get("max")
                            })
                        })
                        newCharacter.get("_defaulttoken", function(defaultToken){
                            var characterToken = JSON.parse(defaultToken);
                            if(characterToken){
                                delete characterToken.represents;
                                delete characterToken.pageid;
                                character.defaultToken = characterToken;
                                for(var i = 1; i <= 3; i++){
                                    if (characterToken["bar"+i+"_link"]) {
                                        character.defaultToken["bar"+i+"_linkName"] = findObjs({_type: 'attribute', _characterid: newCharacter.get("_id")}).find(function(a){
                                            return a.id === characterToken["bar"+i+"_link"];
                                        }).get("name");
                                        delete character.defaultToken["bar"+i+"_link"];
                                    }
                                }
                            }
                            var abilitiesCharacter = findObjs({_type: "ability", _characterid: newCharacter.get("_id")});
                            _.each(abilitiesCharacter, function(ability){
                                var actionCharacter = ability.get("action").trim();
                                while(actionCharacter.indexOf("#") !== -1){
                                    var linesAction = actionCharacter.split("\n");
                                    _.each(linesAction, function(lineAction){
                                        if(lineAction.startsWith("#")){
                                            var findMacro = findObjs({_type: "macro"}).filter(function(obj){
                                                return obj.get("name").trim() === lineAction.substring(1);
                                            })
                                            if(findMacro.length === 1){
                                                actionCharacter = actionCharacter.replace(lineAction, findMacro[0].get("action"));
                                            }
                                        }
                                    })
                                } 
                                character._abilities.push({
                                    _name: ability.get("name"),
                                    _action: actionCharacter,
                                    _istokenaction: ability.get("istokenaction")
                                })
                            })
                            allCharacter.push(character);
                            sendChat("", "/em Export de " + character._name + " effectué.");
                            cpt++;
                            if(cpt === msg.selected.length){
                                var this_handout = createObj("handout", {
                                  name: 'COIE_' + msg.date
                                });
                                this_handout.set('notes', JSON.stringify(allCharacter));
                                sendChat("", "/em Export terminé.");
                            }
                        })
                    })
                })
            }
        })
    },
    
    importCharacter(){
        var handoutImport = findObjs({type: "handout", name: "handoutCOIE"})[0];
        handoutImport.get("notes", function(notes){
            var newNotes = notes.replace(/(<br>|<p>|<\/p>|<\/span>)/g, "").replace(/<a href=\".{1,400}\">/g,"[").replace(/<\/a>/g,"]").trim();
            var goodNotes = newNotes.replace(/<span style=\".{1,250}\">/g, "");
            var allCharacter = JSON.parse(goodNotes);
            _.each(allCharacter, function(character){
                if(findObjs({_type: "character"}).filter(function(obj) {return (obj.get("name").trim() == character._name.trim());}).length > 0){
                    sendChat("", "/em " + character._name + " existe déjà. Import annulé.");
                }else{
                    var newCharacter = createObj("character", {
                        avatar: character._avatar,
                        name: character._name,                    
                    });
                    if(character._gmnotes) newCharacter.set("gmnotes", decodeURIComponent(character._gmnotes));
                    if(character._bio) newCharacter.set("bio", decodeURIComponent(character._bio));
                    if(character._abilities.length){
                        _.each(character._abilities, function(ability) {
                            var newAbility = createObj("ability", {
                                _characterid: newCharacter.get("_id"),
                                name: ability._name,
                                action: ability._action,
                                istokenaction: ability._istokenaction
                            });
                        });
                    }
                    if(character._attributes.length){
                        _.each(character._attributes, function(attribute) {
                            var newAttribute = createObj("attribute", {
                                _characterid: newCharacter.get("_id"),
                                name: attribute._name,
                                current: attribute._current,
                                max: attribute._max
                            });
                        });
                    }
                    if(character.defaultToken){
                        character.defaultToken.pageid = findObjs({_type: 'page'})[0].id;
                        character.defaultToken.represents = newCharacter.get("_id");
                        character.defaultToken.layer = "objects";
                        for(var i = 1; i <= 3; i++){
                            if (character.defaultToken["bar"+i+"_linkName"]) {
                                character.defaultToken["bar"+i+"_link"] = findObjs({type: "attribute", name: character.defaultToken["bar"+i+"_linkName"], _characterid: newCharacter.get("_id")})[0].get("_id");
                                delete character.defaultToken["bar"+i+"_linkName"];
                            }
                        }
                        character.defaultToken.imgsrc = getCleanImgsrc(character.defaultToken.imgsrc);
                        var newToken = createObj("graphic", character.defaultToken);
                        setDefaultTokenForCharacter(newCharacter, newToken);
                        newToken.remove();
                    }
                }
            });
            sendChat("", "/em Import terminé.");
        });
    },
    
    checkMsg(msg) {
        "use strict"
        switch (msg.content) {
          case "!coie-export":
            if(msg.selected === undefined) return sendChat("","/em Veuillez sélectionner un ou plusieurs tokens à exporter");  
            this.exportCharacter(msg);
            return;
        case "!coie-import":
            if(!findObjs({type: "handout", name: "handoutCOIE"}).length) return sendChat("","/em Veuillez créer une handout du nom de \"handoutCOIE\" pour importer");
            if(findObjs({type: "handout", name: "handoutCOIE"}).length === 0) return sendChat("","/em Veuillez coller le tableau JSON dans \"handoutCOIE\" pour importer");
            this.importCharacter();
            return
          default:
            return sendChat("","/em Commmande du script d'import/export inconnue");
        }
    }

};

on("ready", function() {
  scriptCOIELoad = true;
  log("Script COIE version " + versionCOIE + " loaded.");
});

on("chat:message", function(msg) {
  "use strict";
  scriptCOIE.scriptCommand = new RegExp("^!coie-");
  if(msg.type !== "api" || !scriptCOIE.scriptCommand.test(msg.content) || !scriptCOIELoad) return;
  if(!COF_loaded) return sendChat("","/em Veuiller installer le script COFantasy : https://github.com/Ulty/COFantasy");
  msg.date = (new Date()).toISOString().split('.')[0].replace('T', '_');
  scriptCOIE.checkMsg(msg);
});