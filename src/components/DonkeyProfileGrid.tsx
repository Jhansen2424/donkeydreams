"use client";

import { useState, useCallback } from "react";

interface Donkey {
  name: string;
  handle: string;
  tagline: string;
  story: string[];
  traits: string[];
  bestFriends: string[];
  color: string;
  profileImage?: string;
  coverImage?: string;
  galleryImages?: string[];
  sponsorable?: boolean;
  comments?: { from: string; text: string }[];
  likes?: number;
  age?: string;
  gender?: string;
  species?: string;
}

const donkeys: Donkey[] = [
  {
    name: "Pink",
    handle: "@pink.donkeydreams",
    tagline: "The Donkey Dreams Ambassador",
    profileImage: "/donkeys/pink/profile.jpeg",
    galleryImages: ["/donkeys/pink/%231.jpg", "/donkeys/pink/%232.jpg", "/donkeys/pink/%233.jpeg"],
    story: [
      "On Saturday, September 11, 2021 Donkey Dreams Sanctuary Founders, Amber and Edj, lives changed forever when Pink was born. Who knew this precious four legged creature would become a beacon of hope, resiliency, unconditional love and compassion for not only us but every creature who meets her.",
      "Pink had a rough start to life. When she was born, her mom wasn't interested in being a mom so Amber had to bottle feed her. Pink even spent the night inside one night so Amber could bottle feed her every two hours. In the first weeks of Pink's life, we almost lost her three times, but she had a strong will to live so she pulled through.",
      "One of the reasons she survived was because she was able to nurse from Eli's mom. Eli and Pink were born one day apart and their moms are from the same herd so Eli's mom nursed Pink until Pink's mom started nursing her. Since Pink, Eli and their moms, shared a private enclosure for the first couple months of their life, they bonded as a family and the moms nursed each other's babies.",
      "When we decided to adopt Pink and Eli, we wanted to keep their bonded family intact so we also adopted their moms. One of Donkey Dreams' goal is to keep donkey families together so it's no surprise that Pink and her family were some of the first donkeys Amber and Edj adopted.",
      "Despite Pink's early health challenges, she is now incredibly healthy. She lives with her best friend Eli, her two four legged moms and her two legged mom, Amber. Since Amber helped Pink survive her early life challenges they have a precious bond. They spend quite a bit of time caring for the other donkeys together. Pink loves interacting with other donkey residents and visiting human friends. She is often referred to as the Donkey Dreams ambassador.",
    ],
    sponsorable: false,
    traits: ["Ambassador", "Resilient", "Loving", "OG"],
    bestFriends: ["Eli"],
    color: "bg-sky/10",
    likes: 247,
    comments: [
      { from: "Eli", text: "miss you bestie! come back to the pasture 🌾" },
      { from: "Rosie", text: "she thinks she's so special... (she is)" },
      { from: "Dusty", text: "proud of you, kid" },
    ],
  },
  {
    name: "Eli",
    handle: "@eli.prince.of.dreams",
    tagline: "Regal, reserved, and Pink's ride-or-die",
    profileImage: "/donkeys/eli/profile-photo.jpg",
    galleryImages: ["/donkeys/eli/%231.png", "/donkeys/eli/%232.png", "/donkeys/eli/%233.png", "/donkeys/eli/%234.png", "/donkeys/eli/%235.png"],
    story: [
      "Eli is Pink's bestie — and possibly her half-brother. Born just one day apart, their moms are from the same herd in Death Valley, and the resemblance is undeniable: neither of their moms carry the pink coloring that both Pink and Eli share.",
      "Eli met Pink when he was only a couple of days old because their moms kept inadvertently baby swapping. When Pink's mom wasn't consistently nursing her in those critical first days, Eli's mom Rizzo stepped in. Amber placed all four of them — Pink, Eli, Sandy, and Rizzo — in a private enclosure so Rizzo could nurse Pink until Sandy was ready to be a mom. That's exactly what happened, and the four of them bonded as a family for months.",
      "While Pink is the adventurous one, Eli has always carried a regal confidence about him. The team called him Prince Eli early on — he seemed to have a quiet certainty about his role as the alpha Jack of his herd. A little more reserved than Pink, he loves going on adventures with her and has broadened his world because of her.",
      "At a young age, Eli has learned to be a protector — watching over Pink, his two four-legged moms, and even his two-legged mom Amber. He's proof that quiet strength can be just as powerful as a big personality.",
    ],
    sponsorable: false,
    traits: ["Regal", "Protective", "Reserved", "OG"],
    bestFriends: ["Pink"],
    color: "bg-terra/10",
    likes: 198,
    comments: [
      { from: "Pink", text: "day one bestie forever 💕" },
      { from: "Dusty", text: "Prince Eli never misses 👑" },
    ],
  },
  {
    name: "Shelley",
    handle: "@shelley.never.gives.up",
    tagline: "The strongest mama in the herd",
    profileImage: "/donkeys/shelley/profile-photo.jpg",
    galleryImages: ["/donkeys/shelley/%231.jpg", "/donkeys/shelley/%232.jpeg", "/donkeys/shelley/%233.jpg", "/donkeys/shelley/%234.jpg", "/donkeys/shelley/%235.jpg"],
    story: [
      "Being with Shelley teaches us many lessons. The first: you are as strong as you want to be. Shelley started her life in the wild with an extremely deformed front leg and a crooked back. The fact that she survived her childhood is amazing — but that's nothing compared to the rest of her story.",
      "In the wild, Shelley managed to give birth to a brown shaggy girl named Amber, who suffered with the same affliction as her mother. Both survived long enough to be rescued. Amber was young enough for corrective surgery; Shelley was not. A few months later, it was discovered that Shelley was pregnant again. Life was kind — her new little boy, Jethro, was born healthy and normal.",
      "Shelley was an attentive and fiercely protective mother. The other donkeys learned very quickly not to underestimate the strength and determination of this crooked-legged mama. She was quick to discipline any donkey who tried to bully her or her baby.",
      "From the very beginning, Shelley has been a gentle, loving donkey who allows humans to be an important part of her life. Her frequent leg bandaging and hoof care are not pleasant experiences — yet she never refuses treatment. She lifts her legs, holds still, and does whatever is needed. Her best participation is in the love and kisses sessions that follow.",
      "In recent years, her affected leg has started to grow longer, forcing her to stand with it folded on the ground. It makes her already-frequent hoof care even more so. And yet our never-give-up girl continues to roam with the herd, nap in the sun, and snuggle with humans. Shelley knows one final lesson: life is not always fair, but it is the best thing you have — enjoy it.",
    ],
    sponsorable: true,
    traits: ["Resilient", "Protective", "Loving", "Never gives up"],
    bestFriends: ["Jethro", "Amber"],
    color: "bg-sky/10",
    likes: 341,
    comments: [
      { from: "Pink", text: "the strongest girl I know 💪" },
      { from: "Eli", text: "Shelley taught me what courage looks like" },
    ],
  },
  {
    name: "Winnie",
    handle: "@winnie.proves.you.wrong",
    tagline: "Don't judge this book by its cover",
    profileImage: "/donkeys/winnie/profile-photo.jpg",
    galleryImages: ["/donkeys/winnie/%231.jpg", "/donkeys/winnie/%232.jpg", "/donkeys/winnie/%233.jpg", "/donkeys/winnie/%234.jpg", "/donkeys/winnie/%235.jpg"],
    story: [
      "Winnie's story is one of never judging a book by its cover. Born in the wild, Winnie suffers from a birth defect that left her front legs twisted and her back crooked. Her walk is a slow, careful plod — placing each hoof with deliberate precision. Do not make the mistake of labeling her helpless. Winnie will prove you wrong.",
      "This determined mama had two babies in the wild. The first, a boy named Reno, was born with the same twisted legs. The fact that this crooked mama delivered and protected a hampered baby in the wild is remarkable. Even more remarkable — Winnie was already pregnant again. Reno was young enough for corrective surgery. And since poor diet and inbreeding are believed to contribute to the condition, Winnie's second baby, a little girl named Jema, was born with only minor hoof issues — a testament to the prenatal care and nutrition Winnie finally received.",
      "With Jema's arrival, Winnie showed her full strength: protecting her baby from roughhousing donkeys, stepping in when play got too wild, and making sure they both had their place at the hay pile.",
      "Through it all, Winnie showed an extraordinary trust in humans. From the very first day, she allowed rescuers to help with her babies — calmly watching, never panicking. Now as a member of the Donkey Dreams family, Winnie seeks out attention every chance she gets, nudging you with her nose to remind you she's there. She's a happy donkey who seems to know she'll always get the extra care she needs — along with plenty of love.",
    ],
    sponsorable: true,
    traits: ["Determined", "Protective", "Trusting", "Strong"],
    bestFriends: ["Shelley", "Jema"],
    color: "bg-terra/10",
    likes: 289,
    comments: [
      { from: "Shelley", text: "crooked legs, unbreakable spirit 💪" },
      { from: "Pink", text: "Winnie's nose nudges are the best" },
    ],
  },
  {
    name: "Dusty",
    handle: "@dusty.the.leader",
    tagline: "The gentle leader of the herd",
    story: [
      "Dusty was one of the first donkeys to arrive at the sanctuary and immediately took on the role of welcoming committee. If you visit Donkey Dreams, Dusty will be the first face you see — standing at the gate, waiting for chin scratches.",
      "He has a calm, steady presence that the other donkeys gravitate toward. When new rescues arrive scared and uncertain, Dusty is the one who walks over and stands quietly beside them until they feel safe. He leads not with force, but with gentleness.",
      "Dusty loves greeting visitors and has an uncanny ability to sense when someone needs a little extra comfort. He'll rest his head on your shoulder and just breathe with you. That's Dusty — the heart of the herd.",
    ],
    traits: ["Gentle", "Social", "Leader", "Loyal"],
    bestFriends: ["Pepper", "Biscuit"],
    color: "bg-sand/15",
    likes: 312,
    comments: [
      { from: "Pepper", text: "save me a spot at the gate!" },
      { from: "Shadow", text: "thanks for always being there for me 🥺" },
    ],
  },
  {
    name: "Fernie",
    handle: "@fernie.finally.home",
    tagline: "She waited a long time — but she made it",
    profileImage: "/donkeys/fernie/profile-photo.jpg",
    galleryImages: ["/donkeys/fernie/%231.jpg", "/donkeys/fernie/%232.jpg", "/donkeys/fernie/%233.jpg", "/donkeys/fernie/%234.jpg", "/donkeys/fernie/%235.jpg"],
    story: [
      "Fernie was part of a wild herd that lived on an antelope preserve until Fish and Wildlife felt they needed to be relocated. After nearly three years at a rescue, she watched her closest donkey friends leave for adopted homes — while she was left behind. She grew depressed and lonely, until Buster and Elsie, a bonded pair, decided to let her into their group.",
      "In her fourth year, a couple came to visit hoping to adopt Buster and Elsie. As they bonded with the pair, Fernie stayed close. When the woman heard Fernie's story, she couldn't bear the thought of separating her from her friends again — and adopted all three. The trio left together for their happy new home.",
      "Almost four years later, circumstances forced the couple to move somewhere the donkeys couldn't follow. All three were returned to the rescue. The one too many moves took its toll on Fernie. She became wary, stand-offish, and seemed unconvinced she was really home — warming up to humans only if treats were involved.",
      "Fortunately, Donkey Dreams adopted Fernie so she could stay on the ranch she knew. She has since warmed back into her former self — one of the first to come up for attention when anyone approaches. She roams freely with the other herds, mingles with her fellow donkeys, and wanders back to her own pen for the night. Fernie knows that at last, she is really home.",
    ],
    sponsorable: true,
    traits: ["Loyal", "Resilient", "Social", "Free spirit"],
    bestFriends: ["Elsie", "Buster"],
    color: "bg-sage/15",
    likes: 267,
    comments: [
      { from: "Winnie", text: "home is where your herd is 🏡" },
      { from: "Shelley", text: "so glad you stayed, Fernie" },
    ],
  },
  {
    name: "Pepper",
    handle: "@pepper.eats.first",
    tagline: "First one to the feed bucket",
    story: [
      "Pepper was rescued from a neglect case — underweight, scared, and unsure of people. It didn't take long for her true personality to come roaring out. Now she's the first one to the feed bucket, every single time.",
      "She has a big personality packed into a small frame. She'll nudge you until you pay attention, and she's never met a carrot she didn't like. Pepper has become one of the most spirited members of the herd, and her energy is contagious.",
      "Her transformation from a frightened, neglected donkey to the spunkiest girl on the ranch is one of Donkey Dreams' proudest success stories.",
    ],
    traits: ["Spunky", "Brave", "Food-lover", "Energetic"],
    bestFriends: ["Dusty", "Clover"],
    color: "bg-sage/15",
    likes: 186,
    comments: [
      { from: "Dusty", text: "leave some food for the rest of us 😂" },
      { from: "Clover", text: "she literally shoved me out of the way today" },
    ],
  },
  {
    name: "Sandy",
    handle: "@sandy.fun.mom",
    tagline: "Pink's mom, Death Valley original",
    profileImage: "/donkeys/sandy/profile-photo.jpg",
    galleryImages: ["/donkeys/sandy/%231.png", "/donkeys/sandy/%232.png", "/donkeys/sandy/%233.png"],
    story: [
      "Sandy is a wild Jenny from Death Valley, California who came into captivity already pregnant. She is Pink's mom — and her story is one of learning, trust, and becoming.",
      "When Pink was born, Sandy seemed a little overwhelmed by motherhood. Fortunately, Rizzo — her herd mate and Eli's mom — stepped in to nurse Pink while Sandy found her footing. It didn't take long. Sandy settled into her role and has since become what everyone around the sanctuary calls the \"fun mom.\"",
      "We often see Sandy playing with Pink and Eli, rolling in the dirt alongside them, and just being part of the chaos in the most endearing way. She's playful, present, and deeply bonded with her little family.",
      "Even though Sandy came from the wild, she clearly wants to trust humans. The more time she spends around people, the more comfortable she becomes. At Donkey Dreams, we believe in an organic training process — so we'll follow Sandy's lead, at her pace, on her terms.",
    ],
    sponsorable: false,
    traits: ["Wild heart", "Fun mom", "Trusting", "Playful"],
    bestFriends: ["Pink", "Rizzo"],
    color: "bg-sand/15",
    likes: 231,
    comments: [
      { from: "Pink", text: "best mom ever 🥹" },
      { from: "Eli", text: "she does the best dirt rolls" },
    ],
  },
  {
    name: "Rizzo",
    handle: "@rizzo.grazing.smile",
    tagline: "Eli's mom, Pink's second mom, professional grazer",
    profileImage: "/donkeys/rizzo/profile-photo.jpg",
    galleryImages: ["/donkeys/rizzo/%231.png", "/donkeys/rizzo/%232.png", "/donkeys/rizzo/%233.jpg"],
    story: [
      "Rizzo is Eli's mom — and she's also the donkey who helped save Pink's life. A wild Jenny from Death Valley, California, she came into captivity already pregnant. When Pink was just a couple of days old and her own mom wasn't consistently nursing her, Rizzo stepped in without hesitation. Because she nursed Pink from such a young age, she became a true second mom to her.",
      "Rizzo loves her kids fiercely and always knows exactly where they are. She keeps a quiet, watchful eye on Eli and Pink no matter where they roam on the property.",
      "We believe Rizzo is content being a mom and doesn't crave human interaction the way other donkeys do. What she does crave is grazing — and when she eats, she goes somewhere beautiful. She actually looks like she's smiling. It's one of the most peaceful sights on the ranch.",
      "Since coming to Donkey Dreams, her comfort level around humans has grown significantly. But we anticipate Rizzo will always be one of our sanctuary donkeys who is simply here to live her donkey life — and we are completely fine with that. We desire our donkeys to live the life they were designed for.",
    ],
    sponsorable: false,
    traits: ["Devoted mom", "Independent", "Peaceful", "Wild heart"],
    bestFriends: ["Eli", "Sandy"],
    color: "bg-terra/10",
    likes: 198,
    comments: [
      { from: "Eli", text: "best mom in Death Valley and beyond 🌵" },
      { from: "Pink", text: "she literally saved my life 💕" },
    ],
  },
  {
    name: "Pete",
    handle: "@pete.roaming.free",
    tagline: "28 years old and living his best life",
    profileImage: "/donkeys/pete/profile-photo.jpg",
    galleryImages: ["/donkeys/pete/%231.jpg", "/donkeys/pete/%232.png", "/donkeys/pete/%233.jpg", "/donkeys/pete/%234.jpeg", "/donkeys/pete/%235.jpg"],
    age: "28 years",
    gender: "Jack (male)",
    story: [
      "We got to know Pete shortly after his best friend died. When donkeys lose their bonded buddy, they can fall into a deep grief cycle — often stopping eating, and some actually starve to death. When we met Pete, that's exactly what was happening. So Edj, Donkey Dreams Co-Founder, started spending a lot of time with him. He even played his guitar for Pete. Slowly, Pete started to show a will to live again.",
      "At the same time, we began introducing Pete to different donkeys to find him a new companion. After trying a number of different matches, we finally found his next bestie — Lila, a three-year-old tall, beautiful 'pink' female donkey. We were surprised to see them connect so quickly. Pete is 28 years old; Lila was recovering from a difficult birth at a very young age. An unlikely pair — but they bonded deeply and have been together ever since.",
      "At Donkey Dreams, Pete seems to truly enjoy his life. He grazes on all the natural flora on the property, has breakfast with the Co-Founders, gets nose smooches from his human friends, and roams with his gorgeous girlfriend Lila. Pete is proof that it's never too late for a new chapter.",
    ],
    sponsorable: true,
    traits: ["Elder", "Survivor", "Romantic", "Free spirit"],
    bestFriends: ["Lila"],
    color: "bg-sky/10",
    likes: 318,
    comments: [
      { from: "Lila", text: "my favorite old man 🥹" },
      { from: "Rizzo", text: "Pete is an inspiration to us all" },
    ],
  },
  {
    name: "Lila",
    handle: "@lila.supermodel.jenny",
    tagline: "Pete's girlfriend, big sis to the herd",
    profileImage: "/donkeys/lila/profile-photo.jpg",
    galleryImages: ["/donkeys/lila/%231.jpg", "/donkeys/lila/%232.jpg", "/donkeys/lila/%233.jpg"],
    age: "3 years",
    gender: "Jenny (female)",
    story: [
      "Lila came in as a wild Jenny from Death Valley, California — pregnant at barely two years old. She had an incredibly difficult birth before we ever met her, leaving her with so much hip pain that she rejected her newborn foal. That baby became a bottle baby, as Lila never took to him. It took her almost a full year to heal.",
      "Right around the time she started feeling like herself again, she met Pete — a 28-year-old gelding who had just lost his best friend and was slowly fading from grief. Maybe they trauma bonded. Maybe they just fell in love. Either way, they took to each other quickly and have been inseparable ever since.",
      "They are an odd couple by any measure — a three-year-old supermodel 'pink' donkey and a 28-year-old elder. But their love for each other is an inspiration to everyone at the sanctuary.",
      "Now that Lila lives with Pink and Eli, she's taken on the role of big sister to the younger donkeys. While Pete naps (frequently), Lila plays. She has the best of all worlds — a devoted partner, a little family to watch over, and a life full of sunshine and desert adventures.",
    ],
    sponsorable: true,
    traits: ["Resilient", "Big sister", "Playful", "Supermodel"],
    bestFriends: ["Pete", "Pink"],
    color: "bg-sage/15",
    likes: 294,
    comments: [
      { from: "Pete", text: "my gorgeous girl 🩷" },
      { from: "Pink", text: "best big sis in the whole herd!!" },
    ],
  },
  {
    name: "Biscuit",
    handle: "@biscuit.nap.king",
    tagline: "The wise elder",
    story: [
      "At 28 years young, Biscuit is the oldest resident at Donkey Dreams — and he's earned the right to do whatever he pleases. Most of the time, that means long naps in his favorite sunny spot.",
      "Biscuit is the wise elder of the herd. The younger donkeys seem to look up to him, and he tolerates their antics with quiet dignity. He's seen a lot in his years, and there's a peacefulness about him that's hard to describe.",
      "He may move a little slower these days, but Biscuit's presence is a constant reminder that every donkey deserves a safe, comfortable place to grow old.",
    ],
    traits: ["Wise", "Calm", "Sun-seeker", "Dignified"],
    bestFriends: ["Dusty", "Shadow"],
    color: "bg-sky/10",
    likes: 275,
    comments: [
      { from: "Shadow", text: "nap time? 😴" },
      { from: "Rosie", text: "respect your elders!! (but also share the sunny spot)" },
    ],
  },
  {
    name: "Clover",
    handle: "@clover.opens.gates",
    tagline: "The curious youngster",
    story: [
      "Clover is a curious youngster who follows volunteers around like a puppy. She loves apples, investigating new things — buckets, shovels, your pockets — and making everyone smile.",
      "She's the youngest member of the herd and brings a playful energy that lights up the whole sanctuary. Clover has a mischievous streak too — she figured out how to open gate latches, which keeps the team on their toes.",
      "Her curiosity and sweetness remind us why this work matters. Every donkey deserves the chance to be young, free, and endlessly curious.",
    ],
    traits: ["Curious", "Playful", "Sweet", "Mischievous"],
    bestFriends: ["Pepper", "Rosie"],
    color: "bg-terra/10",
    likes: 163,
    comments: [
      { from: "Pepper", text: "stop going through my stuff!!!" },
      { from: "Rosie", text: "she's baby 🥹" },
    ],
  },
  {
    name: "Shadow",
    handle: "@shadow.cuddle.bug",
    tagline: "From scared to the biggest cuddle bug",
    story: [
      "Shadow came to Donkey Dreams underweight and scared of everything. He flinched at every touch and wouldn't make eye contact. His transformation is one of the sanctuary's greatest success stories.",
      "With patience, consistent care, and a lot of quiet time, Shadow slowly began to trust. The first time he accepted a treat from someone's hand was a milestone the whole team celebrated.",
      "Now Shadow is the biggest cuddle bug on the ranch. He leans into hugs, follows his favorite people around, and has become proof that with enough love, even the most frightened soul can heal.",
    ],
    traits: ["Shy", "Cuddly", "Resilient", "Gentle"],
    bestFriends: ["Biscuit", "Eli"],
    color: "bg-sand/15",
    likes: 224,
    comments: [
      { from: "Biscuit", text: "so proud of how far you've come" },
      { from: "Eli", text: "adventure time?? 👀" },
    ],
  },
  {
    name: "Rosie",
    handle: "@rosie.runs.things",
    tagline: "The sass queen",
    story: [
      "Rosie will nudge you for treats and give you attitude if you show up empty-handed. She has perfected the 'treat stare' — a look so intense it could bore a hole through your pocket.",
      "Don't let the sass fool you — Rosie is fiercely loyal to her herd. She's always the first to check on a donkey who seems off, and she's taken Clover under her wing as a big sister figure.",
      "Rosie was rescued from abandonment, and while she'll never tell you she's grateful (that's not her style), you can see it in the way she watches over the others. She's the herd's protector with a personality as big as the Arizona sky.",
    ],
    traits: ["Sassy", "Bold", "Treat-obsessed", "Protective"],
    bestFriends: ["Clover", "Pink"],
    color: "bg-sage/15",
    likes: 203,
    comments: [
      { from: "Clover", text: "best big sis ever!!" },
      { from: "Pink", text: "she gave me the stare today... terrifying" },
    ],
  },
];

// Heart icon component
function HeartIcon({ filled, className = "" }: { filled: boolean; className?: string }) {
  return filled ? (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
  ) : (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 8.25c0-3.105-2.464-5.25-5.438-5.25-1.927 0-3.592.95-4.312 2.552C11.28 3.95 9.615 3 7.688 3 4.714 3 2.25 5.145 2.25 8.25c0 7.22 9.75 12.75 9.75 12.75s9.75-5.53 9.75-12.75z" />
    </svg>
  );
}

// Share icon
function ShareIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
    </svg>
  );
}

// Profile card in the grid
function DonkeyCard({
  donkey,
  onClick,
}: {
  donkey: Donkey;
  onClick: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(donkey.likes ?? 0);
  const [showHeart, setShowHeart] = useState(false);

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!liked) {
      setLiked(true);
      setLikeCount((c) => c + 1);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    } else {
      setLiked(false);
      setLikeCount((c) => c - 1);
    }
  }, [liked]);

  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-sand/10 hover:shadow-lg transition-all hover:-translate-y-1 text-left w-full cursor-pointer flex flex-col h-full"
    >
      {/* Profile photo */}
      <div className="aspect-[3/4] overflow-hidden relative">
        {donkey.profileImage ? (
          <img
            src={donkey.profileImage}
            alt={donkey.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className={`w-full h-full ${donkey.color} flex flex-col items-center justify-center`}
          >
            <span className="text-6xl mb-2">📸</span>
            <p className="text-warm-gray/40 text-xs italic">
              Photo: {donkey.name}
            </p>
          </div>
        )}

        {/* Double-tap heart animation */}
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <HeartIcon
              filled
              className="w-20 h-20 text-white drop-shadow-lg"
            />
            <style>{`
              .heart-pop { animation: heart-pop 0.8s ease-out forwards; }
              @keyframes heart-pop {
                0% { transform: scale(0); opacity: 1; }
                50% { transform: scale(1.3); opacity: 1; }
                100% { transform: scale(1); opacity: 0; }
              }
            `}</style>
          </div>
        )}

        {/* Sponsor badge */}
        {donkey.sponsorable !== false && (
          <div className="absolute top-3 left-3 z-10 bg-terra text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
            <HeartIcon filled className="w-3 h-3" />
            Sponsor Me
          </div>
        )}

        {/* Name overlay at bottom of photo */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-charcoal/70 to-transparent p-4 pt-10">
          <h3 className="text-xl font-bold text-white">{donkey.name}</h3>
          <p className="text-white/60 text-[11px] font-mono">{donkey.handle}</p>
        </div>
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col flex-1">
        {/* Action bar */}
        <div className="flex items-center gap-4 mb-3">
          <div
            className="flex items-center gap-1.5 group/like"
            onClick={handleLike}
          >
            <HeartIcon
              filled={liked}
              className={`w-5 h-5 transition-all ${liked ? "text-red-500 scale-110" : "text-warm-gray/50 group-hover/like:text-red-400"}`}
            />
            <span className={`text-xs font-semibold ${liked ? "text-red-500" : "text-warm-gray/50"}`}>
              {likeCount}
            </span>
          </div>
          {donkey.comments && (
            <div className="flex items-center gap-1.5 text-warm-gray/50">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
              </svg>
              <span className="text-xs font-semibold">{donkey.comments.length}</span>
            </div>
          )}
        </div>

        {/* Latest comment preview */}
        {donkey.comments && donkey.comments.length > 0 && (
          <p className="text-warm-gray text-xs leading-relaxed mb-3">
            <span className="font-bold text-charcoal">{donkey.comments[0].from}</span>{" "}
            {donkey.comments[0].text}
          </p>
        )}

        {/* Trait pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {donkey.traits.slice(0, 3).map((trait) => (
            <span
              key={trait}
              className={`${donkey.color} text-charcoal text-[10px] font-medium px-2.5 py-0.5 rounded-full`}
            >
              {trait}
            </span>
          ))}
        </div>

        {/* Read more hint */}
        <p className="text-sky text-xs font-semibold group-hover:underline mt-auto pt-2">
          View {donkey.name}&apos;s profile →
        </p>
      </div>
    </button>
  );
}

// Photo lightbox with arrows
function PhotoLightbox({
  images,
  index,
  alt,
  onClose,
  onNav,
}: {
  images: string[];
  index: number;
  alt: string;
  onClose: () => void;
  onNav: (index: number) => void;
}) {
  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-charcoal/90 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
      >
        <svg className="w-5 h-5 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Prev */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onNav(index - 1); }}
          className="absolute left-4 z-10 w-11 h-11 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Next */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNav(index + 1); }}
          className="absolute right-4 z-10 w-11 h-11 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <img
        src={images[index]}
        alt={`${alt} ${index + 1}`}
        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Counter */}
      {images.length > 1 && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-mono">
          {index + 1} / {images.length}
        </p>
      )}
    </div>
  );
}

// Tab types for modal
type ProfileTab = "story" | "photos" | "friends";

// Full profile modal — social media style
function DonkeyProfileModal({
  donkey,
  onClose,
  onNavigate,
}: {
  donkey: Donkey;
  onClose: () => void;
  onNavigate: (donkey: Donkey) => void;
}) {
  const [expandedPhotoIndex, setExpandedPhotoIndex] = useState<number | null>(null);
  // Build the full photo list: profile first, then gallery
  const allPhotos = [
    ...(donkey.profileImage ? [donkey.profileImage] : []),
    ...(donkey.galleryImages ?? []),
  ];
  const [activeTab, setActiveTab] = useState<ProfileTab>("story");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(donkey.likes ?? 0);

  const handleLike = () => {
    if (!liked) {
      setLiked(true);
      setLikeCount((c) => c + 1);
    } else {
      setLiked(false);
      setLikeCount((c) => c - 1);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Meet ${donkey.name} — Donkey Dreams Sanctuary`,
          text: donkey.tagline,
          url: window.location.href,
        });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const tabs: { key: ProfileTab; label: string; count?: number }[] = [
    { key: "story", label: "Story" },
    { key: "photos", label: "Photos", count: donkey.galleryImages?.length ?? 0 },
    { key: "friends", label: "Friends", count: donkey.bestFriends.length },
  ];

  // Find friend data for the friends tab
  const friendData = donkey.bestFriends.map((name) =>
    donkeys.find((d) => d.name === name)
  ).filter(Boolean) as Donkey[];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-charcoal/70 backdrop-blur-sm" />

      <div
        className="relative bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Large profile photo */}
        <div className="relative">
          {donkey.profileImage ? (
            <button
              className="w-full aspect-[3/4] sm:aspect-[4/3] overflow-hidden cursor-pointer"
              onClick={() => setExpandedPhotoIndex(0)}
            >
              <img src={donkey.profileImage} alt={donkey.name} className="w-full h-full object-contain bg-charcoal" />
            </button>
          ) : (
            <div className={`${donkey.color} aspect-[3/4] sm:aspect-[4/3] flex items-center justify-center`}>
              <div className="text-7xl">📸</div>
            </div>
          )}
          {/* Name overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-charcoal/80 to-transparent p-6 sm:p-8 pt-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              {donkey.name}
            </h2>
            <p className="text-white/60 font-mono text-xs mt-0.5">{donkey.handle}</p>
            <p className="text-white/60 italic text-sm mt-1">
              {donkey.tagline}
            </p>
          </div>
        </div>

        {/* Action bar — heart, share, sponsor */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-sand/15">
          <div className="flex items-center gap-5">
            {/* Heart */}
            <button onClick={handleLike} className="flex items-center gap-2 cursor-pointer group">
              <HeartIcon
                filled={liked}
                className={`w-6 h-6 transition-all ${liked ? "text-red-500 scale-110" : "text-warm-gray group-hover:text-red-400"}`}
              />
              <span className={`text-sm font-semibold ${liked ? "text-red-500" : "text-warm-gray"}`}>
                {likeCount}
              </span>
            </button>
            {/* Share */}
            <button onClick={handleShare} className="flex items-center gap-2 text-warm-gray hover:text-charcoal transition-colors cursor-pointer group">
              <ShareIcon className="w-6 h-6" />
              <span className="text-sm font-semibold">Share</span>
            </button>
          </div>
          {/* Sponsor / Follow button */}
          {donkey.sponsorable !== false ? (
            <a
              href="/#donate"
              className="bg-terra hover:bg-terra-dark text-white px-5 py-2 rounded-full text-sm font-semibold transition-colors"
            >
              Sponsor {donkey.name}
            </a>
          ) : (
            <div className="text-warm-gray/50 text-xs italic">Not available for sponsorship</div>
          )}
        </div>

        {/* Bio info row — age, gender, species */}
        {(donkey.age || donkey.gender || donkey.species) && (
          <div className="flex flex-wrap gap-4 px-6 sm:px-8 pt-4 pb-1 text-sm text-warm-gray">
            {donkey.gender && (
              <span className="flex items-center gap-1.5">
                <span className="text-warm-gray/50">Gender</span>
                <span className="font-semibold text-charcoal">{donkey.gender}</span>
              </span>
            )}
            {donkey.age && (
              <span className="flex items-center gap-1.5">
                <span className="text-warm-gray/50">Age</span>
                <span className="font-semibold text-charcoal">{donkey.age}</span>
              </span>
            )}
            {donkey.species && (
              <span className="flex items-center gap-1.5">
                <span className="text-warm-gray/50">Species</span>
                <span className="font-semibold text-charcoal">{donkey.species}</span>
              </span>
            )}
          </div>
        )}

        {/* Traits */}
        <div className="flex flex-wrap gap-2 px-6 sm:px-8 pt-4">
          {donkey.traits.map((trait) => (
            <span
              key={trait}
              className={`${donkey.color} text-charcoal text-sm font-medium px-4 py-1.5 rounded-full`}
            >
              {trait}
            </span>
          ))}
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-sand/15 mt-4 px-6 sm:px-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-5 py-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
                activeTab === tab.key
                  ? "border-terra text-charcoal"
                  : "border-transparent text-warm-gray hover:text-charcoal"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? "bg-terra/15 text-terra" : "bg-sand/15 text-warm-gray"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-6 sm:px-8 pt-5 pb-8">
          {/* Story tab */}
          {activeTab === "story" && (
            <div>
              <div className="space-y-4">
                {donkey.story.map((paragraph, i) => (
                  <p key={i} className="text-warm-gray leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Comments section */}
              {donkey.comments && donkey.comments.length > 0 && (
                <div className="mt-8 pt-6 border-t border-sand/15">
                  <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-4">
                    What the herd is saying
                  </h3>
                  <div className="space-y-3">
                    {donkey.comments.map((comment, i) => {
                      const commenter = donkeys.find((d) => d.name === comment.from);
                      return (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-sand/15 flex items-center justify-center">
                            {commenter?.profileImage ? (
                              <img src={commenter.profileImage} alt={comment.from} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs">🫏</span>
                            )}
                          </div>
                          <div className="flex-1 bg-cream rounded-2xl rounded-tl-sm px-4 py-2.5">
                            <span className="font-bold text-charcoal text-sm">{comment.from}</span>
                            <p className="text-warm-gray text-sm">{comment.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Photos tab */}
          {activeTab === "photos" && (
            <div>
              {donkey.galleryImages && donkey.galleryImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {/* Profile image as first photo */}
                  {donkey.profileImage && (
                    <button
                      className="rounded-xl aspect-square overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setExpandedPhotoIndex(0)}
                    >
                      <img src={donkey.profileImage} alt={`${donkey.name} profile`} className="w-full h-full object-cover" />
                    </button>
                  )}
                  {donkey.galleryImages.map((src, i) => (
                    <button
                      key={i}
                      className="rounded-xl aspect-square overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setExpandedPhotoIndex(donkey.profileImage ? i + 1 : i)}
                    >
                      <img src={src} alt={`${donkey.name} photo ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <span className="text-5xl mb-4 block">📷</span>
                  <p className="text-warm-gray text-sm">
                    Photos of {donkey.name} coming soon!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Friends tab */}
          {activeTab === "friends" && (
            <div>
              {friendData.length > 0 ? (
                <div className="space-y-3">
                  {friendData.map((friend) => (
                    <button
                      key={friend.name}
                      onClick={() => onNavigate(friend)}
                      className="flex items-center gap-4 p-3 rounded-2xl bg-cream hover:bg-cream-dark transition-colors w-full text-left cursor-pointer"
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-sand/15">
                        {friend.profileImage ? (
                          <img src={friend.profileImage} alt={friend.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full ${friend.color} flex items-center justify-center`}>
                            <span className="text-xl">🫏</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-charcoal text-sm">{friend.name}</h4>
                        <p className="text-warm-gray text-xs truncate">{friend.tagline}</p>
                      </div>
                      <div className="flex items-center gap-1 text-warm-gray/50">
                        <HeartIcon filled={false} className="w-4 h-4" />
                        <span className="text-xs font-semibold">{friend.likes ?? 0}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <span className="text-5xl mb-4 block">🫏</span>
                  <p className="text-warm-gray text-sm">
                    {donkey.name}&apos;s friend connections coming soon!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Photo lightbox */}
        {expandedPhotoIndex !== null && (
          <PhotoLightbox
            images={allPhotos}
            index={expandedPhotoIndex}
            alt={donkey.name}
            onClose={() => setExpandedPhotoIndex(null)}
            onNav={(i) => setExpandedPhotoIndex(i)}
          />
        )}
      </div>
    </div>
  );
}

export { donkeys };

export default function DonkeyProfileGrid() {
  const [selectedDonkey, setSelectedDonkey] = useState<Donkey | null>(null);

  return (
    <>
      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes heart-pop {
          0% { transform: scale(0); opacity: 1; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
        {donkeys.map((donkey) => (
          <DonkeyCard
            key={donkey.name}
            donkey={donkey}
            onClick={() => setSelectedDonkey(donkey)}
          />
        ))}
      </div>

      {selectedDonkey && (
        <DonkeyProfileModal
          donkey={selectedDonkey}
          onClose={() => setSelectedDonkey(null)}
          onNavigate={(friend) => setSelectedDonkey(friend)}
        />
      )}
    </>
  );
}
