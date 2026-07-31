import mongoose from "mongoose";

const AdBannerSchema = new mongoose.Schema({
  title: String,
  description: String,
  imageUrl: String,
  position: String,
  priority: Number,
  startDate: Date,
  endDate: Date,
  isActive: Boolean,
});

const AdBanner = mongoose.model("AdBanner", AdBannerSchema);

const banners = [
  {
    title: "خرید و فروش آسان",
    imageUrl: "https://placehold.co/1200x300/f97316/white?text=خرید+و+فروش+آسان",
    position: "home_top",
    priority: 1,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2025-12-31"),
    isActive: true,
  },
  {
    title: "آگهی ویژه VIP",
    imageUrl: "https://placehold.co/1200x300/3b82f6/white?text=VIP",
    position: "home_top",
    priority: 2,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2025-12-31"),
    isActive: true,
  },
  {
    title: "ثبت آگهی رایگان",
    imageUrl: "https://placehold.co/1200x200/8b5cf6/white?text=رایگان",
    position: "home_bottom",
    priority: 1,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2025-12-31"),
    isActive: true,
  },
];

async function seed() {
  try {
    await mongoose.connect("mongodb://localhost:27017/divar-clone");
    console.log("✅ Connected");

    for (const banner of banners) {
      const exists = await AdBanner.findOne({ title: banner.title });
      if (!exists) {
        await AdBanner.create(banner);
        console.log(`✅ Added: ${banner.title}`);
      } else {
        console.log(`⏭️ Exists: ${banner.title}`);
      }
    }
    console.log("🎉 Done!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();