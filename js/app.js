var characterImport = [];
const allArrow = document.querySelectorAll('.chapitre-personnages img');

const copyButton = document.getElementById("copy-button");
const jsonText = document.getElementById("json-text");

copyButton.addEventListener("click", function() {
    jsonText.select();
    document.execCommand("copy");
});

allArrow.forEach(element => {
    element.addEventListener('click', function(){

        const height = this.parentNode.parentNode.childNodes[3].scrollHeight;
        const currentChoice = this.parentNode.parentNode.childNodes[3];

        if(this.src.includes('arrow-droite')){
            this.src = 'ressources/arrow-bas.svg';
            gsap.to(currentChoice, {duration: 0.2, height: height + 40, opacity: 1, padding: '20px 15px'});
            for(var i = 1; i < this.parentNode.parentNode.childNodes[3].childNodes[1].childNodes.length; i+=2){
                gsap.to(this.parentNode.parentNode.childNodes[3].childNodes[1].childNodes[i], {"z-index" : "1"});
            }
        } else if (this.src.includes('arrow-bas')){
            this.src = 'ressources/arrow-droite.svg';
            gsap.to(currentChoice, {duration: 0.2, height: 0, opacity: 0, padding: '0px 15px'});
            for(var i = 1; i < this.parentNode.parentNode.childNodes[3].childNodes[1].childNodes.length; i+=2){
                gsap.to(this.parentNode.parentNode.childNodes[3].childNodes[1].childNodes[i], {"z-index" : "0"});
            }
        }
    })
})

function addButtonListeners(buttonList, characterData) {
    buttonList.forEach(element => {
        element.addEventListener('click', function() {
            if(window.getComputedStyle(element).backgroundColor === "rgb(139, 247, 112)") {
                characterImport.push(characterData.find(obj => obj._name === element.innerText));
                element.style.backgroundColor = "rgb(255, 75, 75)";
            } else if(window.getComputedStyle(element).backgroundColor === "rgb(255, 75, 75)"){
                characterImport = characterImport.filter(function(el){
                    return el._name !== element.innerText;
                });
                element.style.backgroundColor = "rgb(139, 247, 112)";                 
            }
            jsonText.value = JSON.stringify(characterImport);
        })
    })
}

function createCards(data, target) {
    const cardList = document.querySelector(target);

    data.forEach(element => {
        let code = `
            <div class="card">
                <img src="${element._avatar}" title="${decodeURIComponent(element._bio).replace(/(<br>|<p>|<\/p>)/g, "").replaceAll("\"","&quot")}">
                <div class="cardText">
                    <button class="buttonCharacter" type="button" title="${element._name}">${element._name}</button>
                </div>
            </div>
        `;
        cardList.innerHTML += code;
    });

    const allButtonList = cardList.querySelectorAll('.buttonCharacter');
    addButtonListeners(allButtonList, data);
}

fetch("json/personnagesPretires.json")
    .then(response => response.json())
    .then(data => createCards(data, ".cardPretireList"));

fetch("json/personnagesClasses.json")
    .then(response => response.json())
    .then(data => createCards(data, ".cardClasseList"));

fetch("json/personnagesBestiaire.json")
    .then(response => response.json())
    .then(data => createCards(data, ".cardBestiaireList"));