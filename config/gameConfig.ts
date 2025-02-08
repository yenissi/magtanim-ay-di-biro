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
      {
        id: 3,
        title: "Beginner Farmer",
        description: "Complete your first harvest",
        reward: 50,
        locked: false,
        completed: false,
      },
      {
        id: 4,
        title: "Green Thumb",
        description: "Grow 5 plants",
        reward: 100,
        locked: false,
        completed: false,
      },
      {
        id: 5,
        title: "Beginner Farmer",
        description: "Complete your first harvest",
        reward: 50,
        locked: false,
        completed: false,
      },
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
      image: require('@/assets/images/asarol1.png'),
    },
    {
      id: 2,
      title: "Itak",
      description: "Basic Tool",
      price: 50,
      type: "tool",
      image: require('@/assets/images/itak.png'),
    },
    {
      id: 3,
      title: "Regadera",
      description: "Basic Tool",
      price: 20,
      type: "tool",
      image: require('@/assets/images/regadera.png'),
    },
    {
      id: 4,
      title: "Sibuyas",
      description: "Simple Crop",
      price: 50,
      type: "crop",
      image: require('@/assets/images/sibuyas.png'),
    },
    {
      id: 5,
      title: "Mangga",
      description: "Basic Tool",
      price: 50,
      type: "tree",
      image: require('@/assets/images/mangga.png'),
    },
    {
      id: 6,
      title: "Carrot",
      description: "Simple Crop ",
      price: 50,
      type: "crop",
      image: require('@/assets/images/karot.png'),
    },
    {
      id: 7,
      title: "Gumamela",
      description: "Simple Flower",
      price: 50,
      type: "crop",
      image: require('@/assets/images/gumamela.png'),
    },
    {
      id: 8,
      title: "Lupa",
      description: "Taniman ng mga Gulay at Prutas",
      price: 10,
      type: "tool",
      image: require('@/assets/images/lupa.png'),
    },
    // {
    //   id: 10,
    //   title: "Chemical Pesticide",
    //   description: "Basic Tool",
    //   price: 50,
    //   type: "tool",
    //   image: require('@/assets/images/chemical.png'),
    // },
  ];