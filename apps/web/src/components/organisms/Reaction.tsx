import React, { use, useRef } from 'react'

type ReactionContextType = {
    mainRef: React.RefObject<HTMLDivElement | null>;
    reactionAnchorRef: React.RefObject<HTMLDivElement | null>;
}

export const ReactionContext = React.createContext<ReactionContextType | null>(null);

export const useReaction = () => {

    const context = use(ReactionContext);


    if (!context) {
        throw new Error('useReaction must be used within a ReactionProvider');
    }

    const runNegativeReaction = () => {
        // get main body element
        const main = context?.mainRef?.current;
        const reactionAnchor = context?.reactionAnchorRef?.current;
        if (!main) {
            return;
        }

        // add a class to the main element
        main.animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(0)' },
        ], {
            duration: 100,
            iterations: 1,
        });
        reactionAnchor?.animate([
            { backgroundColor: 'rgba(255, 0, 0, 0.2)' },
            { backgroundColor: 'rgba(255, 0, 0, 0)' },
        ], {
            duration: 500,
            iterations: 1,
        });

    }

    const runPositiveReaction = () => {
        // get main body element
        const main = context?.mainRef?.current;
        const reactionAnchor = context?.reactionAnchorRef?.current;
        if (!main) {
            return;
        }

        // Screen shake animation for success
        main.animate([
            { transform: 'translateX(0) translateY(0)' },
            { transform: 'translateX(-5px) translateY(-5px)' },
            { transform: 'translateX(5px) translateY(5px)' },
            { transform: 'translateX(-5px) translateY(-5px)' },
            { transform: 'translateX(5px) translateY(5px)' },
            { transform: 'translateX(0) translateY(0)' },
        ], {
            duration: 200,
            iterations: 1,
        });
        
        // Green flash animation
        reactionAnchor?.animate([
            { backgroundColor: 'rgba(0, 255, 0, 0.3)' },
            { backgroundColor: 'rgba(0, 255, 0, 0)' },
        ], {
            duration: 600,
            iterations: 1,
        });

    }


    return {
        runNegativeReaction,
        runPositiveReaction,
    };
}

export const ReactionProvider = ({ children }: { children: React.ReactNode }) => {
    const mainRef = useRef<HTMLDivElement | null>(null);
    const reactionAnchorRef = useRef<HTMLDivElement | null>(null);
    return (
        <ReactionContext value={{ mainRef, reactionAnchorRef }}>
            <div ref={mainRef} className="relative">
                <div ref={reactionAnchorRef} className="absolute top-0 left-0 w-full h-full z-40 pointer-events-none" />
                {children}
            </div>
        </ReactionContext>
    )
}