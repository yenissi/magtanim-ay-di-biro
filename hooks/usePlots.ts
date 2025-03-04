import { useState, useEffect } from 'react';
import type { PlotStatus, PlantData } from '../types';

const GRID_SIZE = 3;
const INFESTATION_CHANCE = 0.5;
const INFESTATION_CHECK_INTERVAL = 10000;
const DECAY_TIME = 30000;

export const usePlots = () => {
  const [plots, setPlots] = useState<PlotStatus[][]>(
    Array(GRID_SIZE).fill(null).map(() => 
      Array(GRID_SIZE).fill(null).map(() => ({
        isPlowed: false,
        isWatered: false,
        plant: undefined
      }))
    )
  );

  // Fix: Properly handle timer cleanup and type safety
  const startInfestationCheck = (row: number, col: number, plant: PlantData): NodeJS.Timeout => {
    return setInterval(() => {
      setPlots(current => {
        const newPlots = [...current];
        if (!newPlots[row]?.[col]?.plant) return current; // Safety check
        
        if (Math.random() < INFESTATION_CHANCE) {
          if (newPlots[row][col].plant) {
            // Clear existing decay timer if any
            if (newPlots[row][col].plant?.decayTimer) {
              clearTimeout(newPlots[row][col].plant.decayTimer);
            }

            const decayTimer = setTimeout(() => {
              setPlots(prev => {
                const newPlotsAfterDecay = [...prev];
                newPlotsAfterDecay[row][col] = {
                  isPlowed: false,
                  isWatered: false,
                  plant: undefined
                };
                return newPlotsAfterDecay;
              });
            }, DECAY_TIME);

            newPlots[row][col].plant = {
              ...newPlots[row][col].plant!,
              hasInfestation: true,
              decayTimer
            };
          }
          return newPlots;
        }
        return current;
      });
    }, INFESTATION_CHECK_INTERVAL);
  };

  // Fix: Proper cleanup of all timers
  useEffect(() => {
    return () => {
      plots.forEach(row => {
        row.forEach(plot => {
          if (plot.plant?.infestationTimer) {
            clearInterval(plot.plant.infestationTimer);
          }
          if (plot.plant?.decayTimer) {
            clearTimeout(plot.plant.decayTimer);
          }
        });
      });
    };
  }, []);

  return { plots, setPlots, startInfestationCheck };
};