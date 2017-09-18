var typeList = ["dagger", "sword", "greatSword", "katana", "staff", "rod", "bow", "axe", "hammer", "spear", "harp", "whip", "throwing", "gun", "mace", "fist", "lightShield", "heavyShield", "hat", "helm", "clothes", "robe", "lightArmor", "heavyArmor", "accessory", "materia"];
var weaponList = ["dagger", "sword", "greatSword", "katana", "staff", "rod", "bow", "axe", "hammer", "spear", "harp", "whip", "throwing", "gun", "mace", "fist"];
var shieldList = ["lightShield", "heavyShield"];
var headList = ["hat", "helm"];
var bodyList = ["clothes", "robe", "lightArmor", "heavyArmor"];
var inventory = {"byType":{},"byCondition":{}};

var data;
var units;
var selectedUnit;

var equipable;

var ennemyResist = {"fire":0,"ice":0,"water":0,"wind":0,"lightning":0,"earth":0,"light":0,"dark":-50};
var ennemyRaces;
var innateElements = [];

var equiped = [null, null, null, null, null, null, null, null, null, null];

var bestValue = 0;
var bestBuild;


function build() {
    if (!selectedUnit) {
        alert("Please select an unit");
        return;
    }
    bestValue = 0;
    bestBuild = null;
    equiped = [null, null, null, null, null, null, null, null, null, null];
    prepareEquipable();
    ennemyRaces = getSelectedValuesFor("races");
    readEnnemyResists();
    optimize();
    logBuild(bestBuild);
}

function prepareEquipable() {
    equipable = [[],[],[],[],["accessory"],["accessory"],["materia"],["materia"],["materia"],["materia"]];
    for (var equipIndex in selectedUnit.equip) {
        if (weaponList.includes(selectedUnit.equip[equipIndex])) {
            equipable[0].push(selectedUnit.equip[equipIndex]);
        } else if (shieldList.includes(selectedUnit.equip[equipIndex])) {
            equipable[1].push(selectedUnit.equip[equipIndex]);
        } else if (headList.includes(selectedUnit.equip[equipIndex])) {
            equipable[2].push(selectedUnit.equip[equipIndex]);
        } else if (bodyList.includes(selectedUnit.equip[equipIndex])) {
            equipable[3].push(selectedUnit.equip[equipIndex]);
        } 
    }
}

function readEnnemyResists() {
    for(var element in ennemyResist) {
        var value = $("#elementalResists td." + element + " input").val();
        if (value) {
            ennemyResist[element] = parseInt(value);
        } else {
            ennemyResist[element] = 0;
        }
    }
}


function order(item1, item2) {
    if (isSpecial(item1)) {
        if (isSpecial(item2)) {
            return 0;
        } else {
            return -1;
        }
    } else {
        if (isSpecial(item2)) {
            return 1;
        } else {
            return calculateValue([item2], 'atk', true) - calculateValue([item1], 'atk', true);    
        }
    }
}

function optimize() {
    var build = [null, null, null, null, null, null, null, null, null, null];
    for (var index in data) {
        optimizeWithNewItem(build, inventory, equipable, data[index], 1);
    }
}


function optimizeWithNewItem(currentBestBuild, inventory, equipable, newItem, newItemQuantity) {
    var build = currentBestBuild.slice();
    if (canBeBestItemForType(newItem, inventory)) {
        var possibleSlots = getPossibleSlotsFor(newItem, equipable);
        for (var slotIndex in possibleSlots) {
            var slot = possibleSlots[slotIndex];
            var oldItem = build[slot];
            build[slot] = newItem;
            var value = calculateValue(build, 'atk');
            if (value > bestValue) {
                bestValue = value;
            } else {
                build[slot] = oldItem;
            }
            /*if (oldItem.type != newItem.type) {
                // Changing the type of equiped item. Look for items that can now be equiped
                var itemsToTest = getRelevantItemsToTest(inventory, newItem);
            }*/
        }
    }
    addToInventory(newItem, inventory);
}

function canBeBestItemForType(newItem, inventory) {
    return getInsertionIndexInList(newItem, inventory.byType[newItem.type]) == 0;
}

function addToInventory(newItem, inventory, itemQuantity) {
    var maxValue = calculateMaxValue(newItem);
    var itemEntry = {"maxValue":maxValue,"item":newItem,"quantity":itemQuantity};
    if (!inventory.byType[newItem.type]) {
        inventory.byType[newItem.type] = [itemEntry];
    } else {
        var listByType = inventory.byType[newItem.type];
        var index = getInsertionIndexInList(newItem, listByType);
        listByType.splice(index, 0, itemEntry);
    }
    if (newItem.equipedConditions) {
        var conditions = getEquipedConditionString(newItem.equipedConditions);
        if (!inventory.byCondition[conditions]) {
            inventory.byCondition[conditions] = [itemEntry];
        } else {
            var index = getInsertionIndexInList(newItem, inventory.byCondition[conditions]);
            byCondition[conditions].splice(index, 0, itemEntry);
        }
    }
}

function getEquipedConditionString(itemCondition) {
    var conditions = itemCondition.slice();
    conditions.sort();
    var first = true;
    var result = "";
    for (var conditionIndex in conditions) {
        if (first) {
            first = false;
        } else {
            result += "-";
        }
        result += conditions[conditionIndex];
    }
    return result;
}

function getInsertionIndexInList(newItem, listByType) {
    for (var index in listByType) {
        if (listByType[index].maxValue < maxValue) {
            return index;
        }
    }
    return listByType.length;
}

function getPossibleSlotsFor(item, equipable) {
    var result = [];
    for (var index in equipable) {
        if (equipable[index].includes(item.type)) {
            result.push(index);
        }
    }
    return result;
}

function getRelevantItemsToTest(inventory, newItem, build) {
    var result = [];
    var itemsByCondition = inventory.byCondition[newItem.type];
    if (itemsByCondition) {
        for (var inventoryIndex in itemsByCondition) {
            result.push(itemsByCondition[inventoryIndex]);
            if (isStackable(itemsByCondition[inventoryIndex].item)) {
                break;
            }        
        }
    }
    for (var index in build) {
        if (build[index] && build[index] != newItem) {
            var conditions = getEquipedConditionString([newItem.type, build[index].type]);
            itemsByCondition = inventory.byCondition[conditions];
            if (itemsByCondition) {
                for (var inventoryIndex in itemsByCondition) {
                    result.push(itemsByCondition[inventoryIndex]);
                    if (isStackable(itemsByCondition[inventoryIndex].item)) {
                        break;
                    }        
                }
            }       
        }
    }
}

function isStackable(item) {
    return !(item.special && item.special.includes("notStackable"));
}

function isOwned(item) {
    if (itemInventory) {
        return itemInventory[item.name];
    } else {
        return true;
    }
}

function findBestEquipableIndex(equiped, item, lockedEquipableIndex) {
    var bestEquipableIndex;
    var bestValue = 0;
    for (var equipableIndex in equipable) {
        if (!lockedEquipableIndex.includes(equipableIndex) && equipable[equipableIndex].includes(item.type) && isApplicable(item, equiped, 0)) {
            var oldItem = equiped[equipableIndex]
            equiped[equipableIndex] = null;
            value = calculateValue(equiped, 'atk');
            if (value > bestValue) {
                bestEquipableIndex = equipableIndex;
                bestValue = value;
            }
            equiped[equipableIndex] = oldItem;
        }
    }
    return bestEquipableIndex;
}


function isApplicable(item, equiped, currentIndex) {
    if (item.exclusiveSex && item.exclusiveSex != selectedUnit.sex) {
        return false;
    }
    if (item.exclusiveUnits && !item.exclusiveUnits.includes(selectedUnit.name)) {
        return false;
    }
    if (item.special && item.special.includes("notStackable")) {
        for (var equipedIndex in equiped) {
            if (equiped[equipedIndex] && equiped[equipedIndex].name == item.name) {
                return false;
            }
        }
    }
    if (item.equipedConditions) {
        var found = 0;
        conditionLoop: for (var conditionIndex in item.equipedConditions) {
            for (var index = 0; index < currentIndex; index++) {
                if (equiped[index].type == item.equipedConditions[conditionIndex]) {
                    found ++;
                    continue conditionLoop;
                }
            }
            for (var index = currentIndex; index < equipable.length; index++) {
                if (equipable[index].includes(item.equipedConditions[conditionIndex])) {
                    found ++;
                    break;
                }
            }
        }
        if (found != item.equipedConditions.length) {
            return false;
        }
    }
    return true;
}

function someEquipmentNoMoreApplicable(build) {
    for (var index in build) {
        if (build[index] && !isApplicable(build[index],build,5)) {
            return true;
        }
    }
    return false;
}

function calculateValue(equiped, stat, ignoreCondition = false) {
    var calculatedValue = calculateStatValue(equiped, stat, ignoreCondition);
    if (stat = 'atk') {
        calculatedValue
        var cumulatedKiller = 0;
        var itemAndPassives = equiped.concat(selectedUnit.skills);
        for (var equipedIndex in itemAndPassives) {
            if (itemAndPassives[equipedIndex] && (ignoreCondition || areConditionOK(itemAndPassives[equipedIndex], equiped))) {
                if (ennemyRaces.length > 0 && itemAndPassives[equipedIndex].killers) {
                    for (var killerIndex in itemAndPassives[equipedIndex].killers) {
                        if (ennemyRaces.includes(itemAndPassives[equipedIndex].killers[killerIndex].name)) {
                            cumulatedKiller += itemAndPassives[equipedIndex].killers[killerIndex].percent;
                        }
                    }
                }
            }
        }
        
        // Element weakness/resistance
        var elements = innateElements.slice();
        if (equiped[0] && equiped[0].element && !elements.includes(equiped[0].element)) {
            elements.push(equiped[0].element);
        };
        if (equiped[1] && equiped[1].element && !elements.includes(equiped[1].element)) {
            elements.push(equiped[1].element);
        };
        var resistModifier = 0;
        
        if (elements.length > 0) {
            for (var element in ennemyResist) {
                if (equiped[0] && equiped[0].element && equiped[0].element == element || equiped[1] && equiped[1].element && equiped[1].element == element) {
                    resistModifier += ennemyResist[element];
                }
            }    
            resistModifier = resistModifier / elements.length;
        }
        
        // Killers
        var killerMultiplicator = 1;
        if (ennemyRaces.length > 0) {
            killerMultiplicator += (cumulatedKiller / 100) / ennemyRaces.length;
        }
        
        calculatedValue = calculatedValue * calculatedValue * (1 - resistModifier) * killerMultiplicator;
    }
    return calculatedValue;
}

function calculateStatValue(equiped, stat, ignoreCondition = false) {
    var calculatedValue = 0;
    if (stat = 'atk') {
        var baseValue = selectedUnit.stats.maxStats[stat] + selectedUnit.stats.pots[stat];
        var calculatedValue = baseValue;
        var itemAndPassives = equiped.concat(selectedUnit.skills);
        var cumulatedKiller = 0;
        for (var equipedIndex in itemAndPassives) {
            if (itemAndPassives[equipedIndex] && (ignoreCondition || areConditionOK(itemAndPassives[equipedIndex], equiped))) {
                if (itemAndPassives[equipedIndex][stat]) {
                    calculatedValue += itemAndPassives[equipedIndex][stat];
                }
                if (itemAndPassives[equipedIndex][stat + '%']) {
                    calculatedValue += itemAndPassives[equipedIndex][stat+'%'] * baseValue / 100;
                }
                if (ennemyRaces.length > 0 && itemAndPassives[equipedIndex].killers) {
                    for (var killerIndex in itemAndPassives[equipedIndex].killers) {
                        if (ennemyRaces.includes(itemAndPassives[equipedIndex].killers[killerIndex].name)) {
                            cumulatedKiller += itemAndPassives[equipedIndex].killers[killerIndex].percent;
                        }
                    }
                }
            }
        }
    }
    return calculatedValue;
}



function areConditionOK(item, equiped) {
    if (item.equipedConditions) {
        var found = 0;
        for (var conditionIndex in item.equipedConditions) {
            for (var equipedIndex in equiped) {
                if (equiped[equipedIndex] && equiped[equipedIndex].type == item.equipedConditions[conditionIndex]) {
                    found ++;
                    break;
                }
            }
        }
        if (found != item.equipedConditions.length) {
            return false;
        }
    }
    return true;
}

function isSpecial(item) {
    return item.dualWield || item.allowUseOf;
}

function logBuild(build) {
    var order = [0,1,2,3,4,5,6,7,8,9];
    var html = "";
    for (var index = 0; index < order.length; index++) {
        var item = build[order[index]];
        if (item) {
            html += '<div class="tr">';
            html += displayItemLine(item);
            html += "</div>";
        }
    }
    $("#results .tbody").html(html);
    $("#resultStats").html("atk = " + Math.floor(calculateStatValue(build, 'atk')) + ' , damage (on 100 def) = ' + Math.floor(calculateValue(build, 'atk') / 100));
}



// Populate the unit html select with a line per unit
function populateUnitSelect() {
    var options = '<option value=""></option>';
    Object.keys(units).sort().forEach(function(value, index) {
        options += '<option value="'+ value + '">' + value + '</option>';
    });
    $("#unitsSelect").html(options);
    $("#unitsSelect").change(function() {
        $( "#unitsSelect option:selected" ).each(function() {
            var selectedUnitData = units[$(this).val()];
            if (selectedUnitData) {
                selectedUnit = selectedUnitData;
                $(baseStats).each(function (index, stat) {
                    $("#baseStat_" + stat).val(selectedUnitData.stats.maxStats[stat] + selectedUnitData.stats.pots[stat]);
		      	});
            } else {
                selectedUnit = '';
                $(baseStats).each(function (index, stat) {
                    $("#baseStat_" + stat).val("");
		      	});
            }
            displayUnitRarity(selectedUnitData);
        });
    });
}

// Displays selected unit's rarity by stars
var displayUnitRarity = function(unit) {
    var rarityWrapper = $('.unit-rarity');
    if (unit) {
        var rarity = unit.max_rarity;

        rarityWrapper.show();
        rarityWrapper.empty();

        for (var i = 0; i < rarity; i++) {
            rarityWrapper.append('<i class="rarity-star" />');
        }
    } else {
        rarityWrapper.hide();
    }
};

function inventoryLoaded() {
   
}
            
$(function() {
    $.get("data.json", function(result) {
        data = result;
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    $.get("unitsWithSkill.json", function(result) {
        units = result;
        populateUnitSelect();
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    
    // Killers
	addTextChoicesTo("races",'checkbox',{'Aquatic':'aquatic', 'Beast':'beast', 'Bird':'bird', 'Bug':'bug', 'Demon':'demon', 'Dragon':'dragon', 'Human':'human', 'Machine':'machine', 'Plant':'plant', 'Undead':'undead', 'Stone':'stone', 'Spirit':'spirit'});
});
