import React from 'react';
import DeckHeatMap from '../components/DeckHeatMap';

export default function Home() {
    return (
        <div className="flex items-center justify-center">
            <div className="text-center w-full">
                <DeckHeatMap />
            </div>
        </div>
    );
};