export const INITIAL_GAME_STATE = {
    level: 1,
    money: 15000,
    missions: [
      {
        id: 1,
        title: "Mag Dilig ng 2 Crop",
        description: "",
        questions: "Tagalog: Bakit mahalaga ang wastong pagdidilig ng halaman?",
        reward: 50,
        locked: false,
        completed: false,
        requiredMissionId: 1,
      },
      {
        id: 2,
        title: "Mag Dilig ng 3 Crop",
        description: "",
        questions: "Tagalog: Anong mga hakbang ang dapat gawin kung ang lupa sa inyong hardin ay tuyo, matigas, at bitak-bitak?",
        reward: 50,
        locked: false,
        completed: false,
        requiredMissionId: 1,
      },
      {
        id: 3,
        title: "Mag Dilig ng 4 Crop",
        description: "",
        questions: "Tagalog: Paano mo masisiguro na natatanggap ng mga halaman ang sapat na sikat ng araw at tubig?",
        reward: 50,
        locked: false,
        completed: false,
        requiredMissionId: 1,
      },
      {
        id: 4,
        title: "Mag tanim ng 2 Ornamental Plant",
        description: "",
        questions: "Tagalog: Ano ang mga pakinabang ng pagtatanim ng mga halamang ornamental sa inyong hardin o pamayanan?",
        reward: 50,
        locked: false,
        completed: false,
        requiredMissionId: 2,
      },
      {
        id: 5,
        title: "Mag tanim ng 3 Ornamental Plant",
        description: "",
        questions: "Tagalog: Paano nakakatulong ang mga halamang ornamental at mga puno sa pagpigil ng pagguho ng lupa, pagbaha at pagpapanatili ng kalidad ng tubig?",
        reward: 50,
        locked: false,
        completed: false,
        requiredMissionId: 2,
      },
      {
        id: 6,
        title: "Mag tanim ng 4 Ornamental Plant",
        description: "",
        questions: "Tagalog: Paano nakakatulong ang mga halamang ornamental at mga puno sa pagpapababa ng polusyon sa hangin?",
        reward: 50,
        locked: false,
        completed: false,
        requiredMissionId: 2,
      },
      {
        id: 7,
        title: "Mag tanim ng 5 Ornamental Plant",
        description: "",
        questions: "Tagalog: Paano pinapaganda ng mga halamang ornamental ang isang lugar?",
        reward: 50,
        locked: false,
        completed: false,
        requiredMissionId: 2,
      },
      {
        id: 8,
        title: "Mag tanim ng kahit anong Ornamental Plant",
        description: "",
        questions: "Tagalog: Bakit mahalagang pumili ng tamang halamang ornamental para sa inyong hardin?",
        reward: 50,
        locked: false,
        completed: false,
        requiredMissionId: 3,
      },
      {
        id: 9,
        title: "Gumamit ng Tools",
        description: "",
        questions: "Tagalog: Ano ang mga karaniwang kasangkapan sa paghahalaman at ano ang kanilang gamit?",
        reward: 50,
        locked: false,
        completed: false,
        requiredMissionId: 3,
      },
      {
        id: 10,
        title: "Gumamait ng Fertilizer",
        description: "",
        questions: "Tagalog: Ano ang mga benepisyo ng paggamit ng organikong abono kumpara sa sintetikong pataba?",
        reward: 50,
        locked: false,
        completed: false,
        requiredMissionId: 4,
      },
      {
        id: 11,
        title: "Mag Decompose",
        description: "",
        questions: "Tagalog: Bakit mahalaga ang pagpili ng angkop na lokasyon para sa compost pit?",
        reward: 50,
        locked: false,
        completed: false,
        requiredMissionId: 4,
      },
      {
        id: 12,
        title: "Mag Decompose",
        description: "",
        questions: "Tagalog: Ano ang mga benepisyo at kahinaan ng paggamit ng organic na pataba sa gardening?",
        reward: 50,
        locked: false,
        completed: false,
        requiredMissionId: 4,
      },
      {
        id: 13,
        title: "Mag tanim ng tree",
        description: "",
        questions: "Tagalog: Bakit mahalaga ang mga puno sa kapaligiran at sa buhay ng tao?",
        reward: 50,
        locked: false,
        completed: false,
        requiredMissionId: 5,
      },
      {
        id: 14,
        title: "Mag tanim ng 2 prutas",
        description: "",
        questions: "Tagalog: Bakit mahalaga ang magkaroon ng regular na suplay ng prutas sa merkado?",
        reward: 50,
        locked: false,
        completed: false,
        requiredMissionId: 5,
      },
      {
        id: 15,
        title: "Mag tanim ng 5 prutas",
        description: "",
        questions: "Tagalog: Paano nakatutulong ang mga puno ng prutas sa suplay ng pagkain ng komunidad?",
        reward: 50,
        locked: false,
        completed: false,
        requiredMissionId: 5,
      },
      {
        id: 16,
        title: "Mag sell ng prutas",
        description: "",
        questions: "Tagalog: Paano maaaring pagkakitaan ng mga pamilya ang mga halamang ornamental?",
        reward: 50,
        locked: false,
        completed: false,
        requiredMissionId: 5,
      },
    ],
    inventory: [],
    statistics: {
      plantsGrown: 0,
      moneyEarned: 0,
      missionsCompleted: 0,
      decomposeCrops:[],
    },
  };
  
  export const SHOP_ITEMS = [
    // {
    //   id: 0,
    //   title: 'Itakv2',
    //   type: 'tool',
    //   description: 'Used for cutting plants or Harvesting',
    //   image: require('@/assets/images/itak.png'),
    //   price: 0,
    // },
    {
      id: 1,
      title: "Asarol",
      description: "Used for tilling soil",
      price: 10,
      type: "tool",
      image: require('@/assets/images/asarol1.png'),
    },
    {
      id: 2,
      title: "Itak",
      description: " Used for cutting plants or Harvesting",
      price: 10,
      type: "tool",
      image: require('@/assets/images/itak.png'),
    },
    {
      id: 3,
      title: "Regadera",
      description: "Used for watering plants",
      price: 10,
      type: "tool",
      image: require('@/assets/images/regadera.png'),
    },
    {
      id: 4,
      title: "Sibuyas",
      description: "A common vegetable crop",
      price: 10,
      type: "crop",
      image: require('@/assets/images/sibuyas.png'),
    },
    {
      id: 5,
      title: "Mangga",
      description: "Bears sweet mango fruits",
      price: 100,
      type: "tree",
      image: require('@/assets/images/mangga.png'),
    },
    {
      id: 6,
      title: "Carrot",
      description: "A root vegetable crop",
      price: 70,
      type: "crop",
      image: require('@/assets/images/karot.png'),
    },
    {
      id: 7,
      title: "Gumamela",
      description: "A flowering ornamental plant",
      price: 200,
      type: "crop",
      image: require('@/assets/images/gumamela.png'),
    },
    {
      id: 8,
      title: "Chemical Pesticide",
      description: "Used to protect crops from pests and insects",
      price: 100,
      type: "tool",
      image: require('@/assets/images/chemical.png'),
    },
    {
      id: 9,
      title: "Synthetic Fertilizer",
      description: "Improves soil nutrients for better crop growth",
      price: 100,
      type: "tool",
      image: require('@/assets/images/fertilizer.png'),
    },
    {
      id: 10,
      title: "Kamatis",
      description: "A juicy red tomato, perfect for salads and sauces.",
      price: 80,
      type: "crop",
      image: require('@/assets/images/kamatis.png'),
    },
    {
      id: 11,
      title: "Santan",
      description: "A vibrant flowering plant known for its sweet nectar.",
      price: 100,
      type: "crop",
      image: require('@/assets/images/santan.png'),
    },
    {
      id: 12,
      title: "Orchids",
      description: "Elegant and exotic flowers admired for their beauty.",
      price: 100,
      type: "crop",
      image: require('@/assets/images/orchid.png'),
    },
    {
      id: 13,
      title: "Saging",
      description: "A nutritious banana plant, great for snacks and desserts.",
      price: 85,
      type: "crop",
      image: require('@/assets/images/saging.png'),
    },
    {
      id: 14,
      title: "Papaya",
      description: "A tropical fruit rich in vitamins and known for its sweet taste.",
      price: 75,
      type: "crop",
      image: require('@/assets/images/papaya.png'),
    },
  ];