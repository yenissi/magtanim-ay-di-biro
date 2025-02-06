export const INITIAL_GAME_STATE = {
    level: 1,
    money: 100,
    missions: [
      {
        id: 1,
        title: "Beginner Farmer",
        description: "Complete your first harvest",
        reward: 50,
        locked: false,
        completed: false,
      },
      {
        id: 2,
        title: "Green Thumb",
        description: "Grow 5 plants",
        reward: 100,
        locked: false,
        completed: false,
      },
      // Add more missions as needed
    ],
    inventory: [],
    statistics: {
      plantsGrown: 0,
      moneyEarned: 0,
      missionsCompleted: 0,
    },
  };
  
  export const SHOP_ITEMS = [
    {
      id: 1,
      title: "Asarol",
      description: "Basic Tool",
      price: 20,
      type: "tool",
    },
    {
      id: 2,
      title: "Kalaykay",
      description: "Basic Tool",
      price: 50,
      type: "tool",
    },
    {
      id: 3,
      title: "Itak",
      description: "Basic Tool",
      price: 50,
      type: "tool",
    },
    {
      id: 4,
      title: "Regadera",
      description: "Basic Tool",
      price: 20,
      type: "tool",
    },
    {
      id: 5,
      title: "Kalaykay",
      description: "Basic Tool",
      price: 50,
      type: "tool",
    },
    {
      id: 6,
      title: "Sibuyas",
      description: "Simple Crop",
      price: 50,
      type: "crop",
    },
    {
      id: 7,
      title: "Mangga",
      description: "Basic Tool",
      price: 50,
      type: "tree",
    },
    {
      id: 8,
      title: "Carrot",
      description: "Simple Crop ",
      price: 50,
      type: "crop",
    },
    {
      id: 9,
      title: "Gumamela",
      description: "Simple Flower",
      price: 50,
      type: "tree",
    },
    {
      id: 10,
      title: "Chemical Pesticide",
      description: "Basic Tool",
      price: 50,
      type: "tool",
    },
  ];