import { Plugin, TFile } from 'obsidian';

export default class CanvasPlugin extends Plugin {
    
    // Will add function to zoom into bubbles on hover
    // image support
    // include paths

    async onload() {

        console.log('Loading canvas plugin');
        
        // reading mode or rendering for html / pdf
        // goes through each markdown block to check if theres an embed present
        this.registerMarkdownPostProcessor((element, context) => {

            const elements = element.querySelectorAll(".internal-embed");

            elements.forEach(element => {
                const linkSource = element.getAttribute('src');
                    if (linkSource && linkSource.endsWith('.canvas')) {
                        console.log("Canvas embedded:", linkSource);
                        // add text
                    }
            });

        })

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
                                    console.log("vhbaskhgasvdf")
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
                        
                        const minimap : SVGElement = (rect.parentElement as SVGElement & HTMLElement)
                        const group = minimap.createSvg("g")
                        
                        group.appendChild(rect)

                        const text = group.createSvg("text")
                        text.setText(canvasjson["nodes"][i].text)

                        text.setAttribute("x", (rect.x.baseVal.value + rect.width.baseVal.value/2).toString())
                        // Text weirdly offset so +3 should fix for now
                        text.setAttribute("y", ((rect.y.baseVal.value + rect.height.baseVal.value/2) + 3).toString())
                        text.setAttribute("text-anchor", "middle")
                        text.setAttribute("dominant-baseline", "middle")

                        // css variables dont work on svg elements such as <text> so render it with the css markdown-preview-view class
                        // to get the theme variables and add them as svg ones
                        text.addClass("markdown-preview-view")
                        text.setAttribute("fill", getComputedStyle(text).getPropertyValue("color"))
                        text.setAttribute("font-family", getComputedStyle(text).getPropertyValue("font-family"))
                        text.setAttribute("font-size", getComputedStyle(text).getPropertyValue("font-size"))
                        
                    }
                
                }

            });

        }

    }
    
}