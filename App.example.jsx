import Gallery from "./components/Gallery";

// Put your images in /public/images (referenced as /images/1.jpg)
// or import them from src/assets.
const items = [
  { src: "/images/1.jpg", title: "Ribbed Shell" },
  { src: "/images/2.jpg", title: "Terracotta Pots" },
  { src: "/images/3.jpg", title: "Amber Jelly" },
  { src: "/images/4.jpg", title: "Watering Can" },
  { src: "/images/5.jpg", title: "Folded Paper" },
  { src: "/images/6.jpg", title: "Megaphone" },
  { src: "/images/7.jpg", title: "Rubber Bellows" },
  { src: "/images/8.jpg", title: "Traffic Cone" },
];

export default function App() {
  return <Gallery items={items} />;
}
