
import React, { useEffect, useRef } from 'react';
import { GameState } from '../types';

interface UserAppRunnerProps {
    code: string;
    gameState: GameState;
}

export const UserAppRunner: React.FC<UserAppRunnerProps> = ({ code, gameState }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (iframeRef.current) {
            // Serialize safe parts of the state to inject
            const apiData = {
                system: {
                    money: gameState.money,
                    level: gameState.level,
                    username: gameState.username,
                    day: gameState.day,
                    time: gameState.timeOfDay,
                    temperature: gameState.temperature,
                    energy: gameState.energy
                },
                inventory: gameState.inventory.map(i => ({ uid: i.uid, itemId: i.itemId, durability: i.durability })),
                equipped: gameState.equipped
            };

            const apiScript = `
                <script>
                    // ANG.JS Framework Injection
                    window.ang = {
                        system: {
                            alert: (msg) => alert("[ANG_OS] " + msg),
                            log: (msg) => console.log(msg),
                            getStats: () => (${JSON.stringify(apiData.system)}),
                        },
                        user: {
                            username: "${gameState.username}",
                            level: "${gameState.level}"
                        },
                        inventory: {
                            get: () => (${JSON.stringify(apiData.inventory)})
                        },
                        market: {
                            createListing: (id, price) => console.log("Listing created via API", id, price)
                        }
                    };
                    // CSS Reset for better iframe look
                    if(!document.head.querySelector('style')) {
                        const style = document.createElement('style');
                        style.textContent = "body { margin: 0; font-family: monospace; color: #eee; } ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: #444; }";
                        document.head.appendChild(style);
                    }
                </script>
            `;
            
            let fullCode = code;
            // Smart Injection: Put API script before closing body or inside head, or append if raw code
            if (code.includes('</body>')) {
                fullCode = code.replace('</body>', `${apiScript}</body>`);
            } else if (code.includes('</html>')) {
                fullCode = code.replace('</html>', `${apiScript}</html>`);
            } else {
                // Raw snippet or simple html
                fullCode = apiScript + code;
            }
            
            const blob = new Blob([fullCode], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            iframeRef.current.src = url;

            return () => {
                URL.revokeObjectURL(url);
            };
        }
    }, [code, gameState]); 

    return (
        <iframe 
            ref={iframeRef} 
            className="w-full h-full bg-[#111] border-0" 
            sandbox="allow-scripts allow-modals allow-forms allow-popups allow-pointer-lock"
            title="User Application"
        />
    );
};
