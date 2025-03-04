import { ref, update } from "firebase/database";
import { Firebase_Database } from "@/firebaseConfig";

export const savePlotsState = async (userId: string, plotsData: any) => {
  try {
    const userRef = ref(Firebase_Database, `users/${userId}`);
    await update(userRef, {
      plotsState: plotsData,
    });
    console.log("Plots state saved successfully");
  } catch (error) {
    console.error("Error saving plots state:", error);
    throw error;
  }
};
