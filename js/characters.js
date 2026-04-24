// ============================================
// CHARACTERS DATA
// ============================================
const CHARACTERS = [
  { id: 1, name: "Alex", gender: "male",   glasses: false, beard: false, mustache: false, hairColor: "brown",  hat: false, emoji: "👨", image: "assets/character/1.png" },
  { id: 2, name: "Maria",gender: "female", glasses: true,  beard: false, mustache: false, hairColor: "black",  hat: false, emoji: "👩", image: "assets/character/2.png" },
  { id: 3, name: "Tom",  gender: "male",   glasses: false, beard: true,  mustache: false, hairColor: "blonde", hat: false, emoji: "🧔", image: "assets/character/3.png" },
  { id: 4, name: "Sara", gender: "female", glasses: false, beard: false, mustache: false, hairColor: "red",    hat: true,  emoji: "👒", image: "assets/character/4.png" },
  { id: 5, name: "Dave", gender: "male",   glasses: true,  beard: false, mustache: true,  hairColor: "black",  hat: false, emoji: "🕵️", image: "assets/character/5.png" },
  { id: 6, name: "Lisa", gender: "female", glasses: false, beard: false, mustache: false, hairColor: "blonde", hat: false, emoji: "💁", image: "assets/character/6.png" },
  { id: 7, name: "Max",  gender: "male",   glasses: false, beard: true,  mustache: true,  hairColor: "brown",  hat: true,  emoji: "🤠", image: "assets/character/7.png" },
  { id: 8, name: "Nina", gender: "female", glasses: true,  beard: false, mustache: false, hairColor: "brown",  hat: false, emoji: "🤓", image: "assets/character/8.png" },
  { id: 9, name: "Paul", gender: "male",   glasses: false, beard: false, mustache: false, hairColor: "white",  hat: false, emoji: "👴", image: "assets/character/9.png" },
  { id: 10,name: "Zoe",  gender: "female", glasses: false, beard: false, mustache: false, hairColor: "black",  hat: true,  emoji: "🎩", image: "assets/character/10.png" },
  { id: 11,name: "Jack", gender: "male",   glasses: true,  beard: true,  mustache: false, hairColor: "red",    hat: false, emoji: "🧑", image: "assets/character/11.png" },
  { id: 12,name: "Eve",  gender: "female", glasses: false, beard: false, mustache: false, hairColor: "blonde", hat: false, emoji: "👱", image: "assets/character/12.png" },
  { id: 13,name: "Ray",  gender: "male",   glasses: false, beard: false, mustache: true,  hairColor: "black",  hat: false, emoji: "🫅", image: "assets/character/13.png" },
  { id: 14,name: "Amy",  gender: "female", glasses: true,  beard: false, mustache: false, hairColor: "red",    hat: false, emoji: "👸", image: "assets/character/14.png" },
  { id: 15,name: "Bob",  gender: "male",   glasses: false, beard: true,  mustache: false, hairColor: "blonde", hat: true,  emoji: "🎅", image: "assets/character/15.png" },
  { id: 16,name: "Mia",  gender: "female", glasses: false, beard: false, mustache: false, hairColor: "brown",  hat: false, emoji: "🙋", image: "assets/character/16.png" },
  { id: 17,name: "Leo",  gender: "male",   glasses: true,  beard: false, mustache: false, hairColor: "brown",  hat: false, emoji: "👓", image: "assets/character/17.png" },
  { id: 18,name: "Ivy",  gender: "female", glasses: false, beard: false, mustache: false, hairColor: "black",  hat: false, emoji: "💃", image: "assets/character/18.png" },
  { id: 19,name: "Sam",  gender: "male",   glasses: false, beard: true,  mustache: true,  hairColor: "black",  hat: false, emoji: "🧑‍🦱", image: "assets/character/19.png" },
  { id: 20,name: "Kay",  gender: "female", glasses: true,  beard: false, mustache: false, hairColor: "blonde", hat: true,  emoji: "👰", image: "assets/character/20.png" },
  { id: 21,name: "Finn", gender: "male",   glasses: false, beard: false, mustache: false, hairColor: "red",    hat: false, emoji: "🧑‍🦰", image: "assets/character/21.png" },
  { id: 22,name: "Rosa", gender: "female", glasses: false, beard: false, mustache: false, hairColor: "brown",  hat: false, emoji: "💆", image: "assets/character/22.png" },
  { id: 23,name: "Cole", gender: "male",   glasses: true,  beard: false, mustache: true,  hairColor: "white",  hat: false, emoji: "🧓", image: "assets/character/23.png" },
  { id: 24,name: "Jade", gender: "female", glasses: false, beard: false, mustache: false, hairColor: "black",  hat: true,  emoji: "🧕", image: "assets/character/24.png" }
];

// Helper: get character by id
function getCharacterById(id) {
  return CHARACTERS.find(c => c.id === id);
}

// Helper: background color based on hair color (for card styling)
function charBgColor(char) {
  const colors = {
    brown:  "#6B3A2A",
    black:  "#1a1a2e",
    blonde: "#8B7536",
    red:    "#6B1A1A",
    white:  "#4a4a6a"
  };
  return colors[char.hairColor] || "#0f2040";
}