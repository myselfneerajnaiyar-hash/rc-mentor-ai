"use client";

import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export function startProductTour(isCatStudent, brandName = "Auctor RC") {


   
  const catSteps = [
    {

        
  popover: {
    title: `👋 Welcome to ${brandName}`,
    description:
      "This 60-second tour will show you the most important features to improve your reading. Let's begin!"
  }
},

{
      element: "#daily-rc",
      popover: {
        title: "🏆 Daily RC Challenge",
       description:
"Start every day with one fresh actual CAT Passage. Track your rank on the leaderboard and build consistency."
      }
    },
    {
      element: "#daily-workout",
      popover: {
        title: "💪 Daily Workout",
       description:
"Your complete daily practice in one place. Finish this to improve Reading, Vocabulary and Speed together."
      }
    },
    {
      element: "#rc-generator",
      popover: {
        title: "📖 RC Generator",
       description:
"Create unlimited RCs on any topic, difficulty and length. You'll never run out of practice."
      }
    },
    {
      element: "#vocab-lab",
      popover: {
        title: "📚 Vocabulary Lab",
       description:
"Learn, revise and retain high-frequency vocabulary with smart AI-powered revision."
      }
    },
    {
      element: "#speed-drill",
      popover: {
        title: "⚡ Speed Reading Gym",
        description:
"Train yourself to read faster without losing comprehension. Perfect for improving CAT speed."
      }
    },
    {
      element: "#sectionals",
      popover: {
        title: "🎯 CAT Sectionals",
       description:
"Attempt full CAT VARC sectionals and receive AI-powered diagnosis after every test."
      }
    }
  ];

  const nonCatSteps = [
    {

        popover: {
    title: `👋 Welcome to ${brandName}`,
    description:
      "This 60-second tour will show you the most important features to improve your reading. Let's begin!"
  }
},

 {
      element: "#daily-workout",
      popover: {
        title: "💪 Daily Workout",
       description:
"Your complete daily practice in one place. Finish this to improve Reading, Vocabulary and Speed together."
      }
    },

   {
      element: "#rc-generator",
      popover: {
        title: "📖 RC Generator",
       description:
"Create unlimited RCs on any topic, difficulty and length. You'll never run out of practice."
      }
    },

   {
      element: "#vocab-lab",
      popover: {
        title: "📚 Vocabulary Lab",
       description:
"Learn, revise and retain high-frequency vocabulary with smart AI-powered revision."
      }
    },

     {
      element: "#speed-drill",
      popover: {
        title: "⚡ Speed Reading Gym",
        description:
"Train yourself to read faster without losing comprehension. Perfect for improving CAT speed."
      }
    },
    {
      element: "#editorial",
      popover: {
        title: "📰 Birbal Editorial Decoder",
        description:
          "Upload editorials and let Birbal explain them paragraph by paragraph."
      }
    },
    {
      element: "#precision",
      popover: {
        title: "🎯 Precision Drills",
        description:
          "AI-generated drills based on your weakest RC skills."
      }
    }
  ];

  const driverObj = driver({
  showProgress: true,
  animate: true,
  allowClose: true,
  stagePadding: 12,
  stageRadius: 18,
  nextBtnText: "Next",
  prevBtnText: "Back",
  doneBtnText: "Start Learning 🚀",
  steps: isCatStudent ? catSteps : nonCatSteps,
});

  setTimeout(() => {
  driverObj.drive();
}, 800);
}
