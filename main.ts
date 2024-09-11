import { Plugin, TFile, Setting } from 'obsidian';

interface Settings{

    extendScrollableNodes: boolean;

}
const DEFAULT: Settings = {

    extendScrollableNodes: true

}

export default class CanvasPlugin extends Plugin {
    settings: Settings

    // make paths beneath not visible as it scales down

    // image support
    // include path arrows


    async onload() {

        

        console.log('Loading canvas plugin');

        // reading mode or rendering for html / pdf
        // goes through each markdown block to check if theres an embed present
        // Could be useful but the other observer events are sufficent enough for now and render it right every time
        // this.registerMarkdownPostProcessor((element, context) => {return})

        const observer = new MutationObserver((mutationsList) => {
            mutationsList.forEach((mutation) => {
                
                // whenever new html node is created/ modified
                if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                    
                    mutation.addedNodes.forEach((node) => {
                        
                        if (node instanceof HTMLElement) {
                            
                            // Fires whenever document is completely rerendered such as when the page is made active
                            const embeds = node.querySelectorAll(".internal-embed");
                            embeds.forEach((embed) => {
                                
                                manipulateEmbed(embed);
                            
                            });
                            
                            // Fires when actively added html block is an embedded canvas (basically newly made ones)
                            if (node.classList.contains("internal-embed")) {
                                const linkSource = node.getAttribute('src');
                                if (linkSource && linkSource.endsWith('.canvas')) {

                                    manipulateEmbed(node)

                                }
                            }
                        } 
                        // ignores if the modified node is just text
                        else if (node.nodeType === Node.TEXT_NODE) {
                            
                            return;
                        
                        }
                    });
                }
            });
        });
        
        const targetNode = document.querySelector('.workspace-split') || document.body;
        observer.observe(targetNode, { childList: true, subtree: true });
        
    }

    onunload() {
        console.log('Unloading canvas plugin');
    }

}

function manipulateEmbed(embed: Element){
    
    const canvasname = embed.getAttribute('src');
                                
    if (canvasname && canvasname.endsWith('.canvas')) {
        
        // !Could be a problem in the future if theres different files with the same name in different paths
        // Looping through files until file name fits because theres no
        // function to get the full file path from the html element
        // for ex. <div class="internal-embed canvas-embed inline-embed is-loaded" tabindex="-1" src="TestCanvas.canvas" alt="TestCanvas" contenteditable="false">
        // src only showing me file name
        const files = this.app.vault.getFiles();
        let canvas: TFile | undefined;

        for (let index = 0; index < files.length; index++) {
            
            const file = files[index];
            
            if(file.name==canvasname){
                
                canvas=file;
                break;
            
            }
            
        }
        
        if(canvas){

            this.app.vault.read(canvas).then((content: any)=>{

                const canvasjson = JSON.parse(content);

                const rects = embed.querySelector(".canvas-minimap")?.querySelectorAll("rect")
                if(rects){

                    for (let i = 0; i < rects.length; i++) {
                        const rect = rects[i];
                        rect.addClass("canvas-node-bubble")
                        
                        const minimap : SVGElement = (rect.parentElement as SVGElement & HTMLElement)
                        const group = minimap.createSvg("g")
                        group.addClass("canvas-node-magnify")

                        group.appendChild(rect)

                        group.addEventListener("mouseenter", ()=>{
                            //group.parentNode?.appendChild(group)
                            //requestAnimationFrame(()=>requestAnimationFrame(()=>{
                                group.parentNode?.insertBefore(group, null)
                                
                            //}))
                            //rect.setAttribute("stroke", rect.getAttribute("fill").)
                        })
                        
                        // use foreign object wrapper to render <p>
                        const wrapper = group.createSvg("foreignObject");

                        const text = wrapper.createEl("p")
                        text.setText(canvasjson["nodes"][i].text)
                        text.addClass("Canvas-embed-text")

                        wrapper.setAttribute("width", rect.width.baseVal.valueAsString)
                        wrapper.setAttribute("height", rect.height.baseVal.valueAsString)
                        wrapper.setAttribute("x", rect.x.baseVal.value.toString())
                        wrapper.setAttribute("y", rect.y.baseVal.value.toString())
                        
                        // Check if its a single line to align it vertically
                        if(text.scrollHeight <= parseInt(getComputedStyle(text).height)){
                            text.addClass("single-line")
                        }
                        else{
                            text.addClass("multi-line")
                        }
                        
                    }
                
                }

            });

        }

    }
    
}