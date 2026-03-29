export default function BranchCanopyBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <svg
        className="w-full h-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMinYMax slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="canopy-fade" cx="0.15" cy="0.85" r="0.85">
            <stop offset="0%" stopColor="white" />
            <stop offset="35%" stopColor="white" stopOpacity={0.7} />
            <stop offset="60%" stopColor="white" stopOpacity={0.25} />
            <stop offset="85%" stopColor="white" stopOpacity={0.05} />
            <stop offset="100%" stopColor="black" />
          </radialGradient>
          <mask id="canopy-mask">
            <rect width="1920" height="1080" fill="url(#canopy-fade)" />
          </mask>
        </defs>

        <g opacity={0.5}>
          {/* ── Trunk ── */}
          <path
            d="M 70 1080 C 72 960, 85 840, 100 720 C 115 600, 125 520, 140 440"
            stroke="#C7D2FE"
            strokeWidth={12}
            fill="none"
            strokeLinecap="round"
          />

          {/* ── Primary branches ── */}
          {/* Branch A — sweeps up and right */}
          <path
            d="M 140 440 C 180 380, 280 320, 420 270"
            stroke="#C7D2FE"
            strokeWidth={7}
            fill="none"
            strokeLinecap="round"
          />
          {/* Branch B — sweeps wide right from mid-trunk */}
          <path
            d="M 115 620 C 160 570, 280 510, 440 460"
            stroke="#A5B4FC"
            strokeWidth={7}
            fill="none"
            strokeLinecap="round"
          />
          {/* Branch C — lower, extends far right */}
          <path
            d="M 100 750 C 150 700, 300 640, 500 590"
            stroke="#C7D2FE"
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
          />
          {/* Branch D — curves leftward/upward from upper trunk */}
          <path
            d="M 130 500 C 110 440, 80 370, 60 290"
            stroke="#A5B4FC"
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
          />

          {/* ── Secondary branches ── */}
          {/* From Branch A */}
          <path
            d="M 280 340 C 320 310, 400 280, 500 250"
            stroke="#A5B4FC"
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 350 300 C 370 260, 410 220, 470 180"
            stroke="#C7D2FE"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
          {/* From Branch B */}
          <path
            d="M 300 530 C 350 500, 430 470, 540 440"
            stroke="#C7D2FE"
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 370 490 C 400 450, 460 410, 550 380"
            stroke="#A5B4FC"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
          {/* From Branch C */}
          <path
            d="M 310 660 C 370 630, 460 600, 580 570"
            stroke="#A5B4FC"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 420 620 C 470 580, 530 550, 620 530"
            stroke="#C7D2FE"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
          {/* From Branch D */}
          <path
            d="M 90 380 C 60 340, 30 290, 20 230"
            stroke="#C7D2FE"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 100 430 C 60 400, 30 360, 10 310"
            stroke="#A5B4FC"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />

          {/* ── Tertiary wisps ── */}
          <path d="M 420 270 C 450 250, 490 240, 530 230" stroke="#A5B4FC" strokeWidth={2} fill="none" strokeLinecap="round" />
          <path d="M 500 250 C 530 230, 570 220, 610 215" stroke="#C7D2FE" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          <path d="M 470 180 C 500 160, 530 150, 570 145" stroke="#A5B4FC" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          <path d="M 540 440 C 570 430, 610 420, 650 415" stroke="#A5B4FC" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          <path d="M 550 380 C 580 365, 620 355, 660 350" stroke="#C7D2FE" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          <path d="M 580 570 C 620 555, 660 545, 710 540" stroke="#C7D2FE" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          <path d="M 620 530 C 660 520, 700 510, 750 505" stroke="#A5B4FC" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          <path d="M 440 460 C 470 445, 510 435, 560 430" stroke="#C7D2FE" strokeWidth={2} fill="none" strokeLinecap="round" />
          <path d="M 500 590 C 540 575, 580 565, 630 560" stroke="#A5B4FC" strokeWidth={2} fill="none" strokeLinecap="round" />
          <path d="M 60 290 C 45 250, 35 210, 30 170" stroke="#C7D2FE" strokeWidth={2} fill="none" strokeLinecap="round" />
          <path d="M 20 230 C 10 200, 8 170, 12 140" stroke="#A5B4FC" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          <path d="M 10 310 C -5 280, -10 250, -8 220" stroke="#C7D2FE" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          {/* Upper canopy wisps */}
          <path d="M 200 360 C 230 330, 270 310, 310 295" stroke="#A5B4FC" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          <path d="M 160 480 C 190 450, 240 430, 290 420" stroke="#C7D2FE" strokeWidth={1.5} fill="none" strokeLinecap="round" />

          {/* ── Leaf dots (branch tips) ── */}
          {/* Primary branch tips */}
          <circle cx={420} cy={270} r={5} fill="#A5B4FC" />
          <circle cx={440} cy={460} r={5} fill="#C7D2FE" />
          <circle cx={500} cy={590} r={5} fill="#A5B4FC" />
          <circle cx={60} cy={290} r={4} fill="#C7D2FE" />

          {/* Secondary branch tips */}
          <circle cx={500} cy={250} r={4} fill="#C7D2FE" />
          <circle cx={470} cy={180} r={4} fill="#A5B4FC" />
          <circle cx={540} cy={440} r={4} fill="#A5B4FC" />
          <circle cx={550} cy={380} r={4} fill="#C7D2FE" />
          <circle cx={580} cy={570} r={3.5} fill="#C7D2FE" />
          <circle cx={620} cy={530} r={3.5} fill="#A5B4FC" />
          <circle cx={20} cy={230} r={3.5} fill="#A5B4FC" />
          <circle cx={10} cy={310} r={3.5} fill="#C7D2FE" />

          {/* Tertiary tips */}
          <circle cx={530} cy={230} r={3} fill="#C7D2FE" />
          <circle cx={610} cy={215} r={2.5} fill="#A5B4FC" />
          <circle cx={570} cy={145} r={2.5} fill="#C7D2FE" />
          <circle cx={650} cy={415} r={2.5} fill="#A5B4FC" />
          <circle cx={660} cy={350} r={2.5} fill="#C7D2FE" />
          <circle cx={710} cy={540} r={2.5} fill="#A5B4FC" />
          <circle cx={750} cy={505} r={2} fill="#C7D2FE" />
          <circle cx={560} cy={430} r={2.5} fill="#A5B4FC" />
          <circle cx={630} cy={560} r={2.5} fill="#C7D2FE" />
          <circle cx={30} cy={170} r={2.5} fill="#A5B4FC" />
          <circle cx={12} cy={140} r={2} fill="#C7D2FE" />
          <circle cx={-8} cy={220} r={2} fill="#A5B4FC" />
          <circle cx={310} cy={295} r={2.5} fill="#C7D2FE" />
          <circle cx={290} cy={420} r={2.5} fill="#A5B4FC" />
        </g>

        {/* ── Green tree from top-right ── */}
        <g opacity={0.5}>
          {/* ── Trunk ── */}
          <path
            d="M 1850 0 C 1848 120, 1835 240, 1820 360 C 1805 480, 1795 560, 1780 640"
            stroke="#A7F3D0"
            strokeWidth={12}
            fill="none"
            strokeLinecap="round"
          />

          {/* ── Primary branches ── */}
          {/* Branch A — sweeps down and left */}
          <path
            d="M 1780 640 C 1740 700, 1640 760, 1500 810"
            stroke="#A7F3D0"
            strokeWidth={7}
            fill="none"
            strokeLinecap="round"
          />
          {/* Branch B — sweeps wide left from mid-trunk */}
          <path
            d="M 1805 460 C 1760 510, 1640 570, 1480 620"
            stroke="#6EE7B7"
            strokeWidth={7}
            fill="none"
            strokeLinecap="round"
          />
          {/* Branch C — upper, extends far left */}
          <path
            d="M 1820 330 C 1770 380, 1620 440, 1420 490"
            stroke="#A7F3D0"
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
          />
          {/* Branch D — curves rightward/downward from lower trunk */}
          <path
            d="M 1790 580 C 1810 640, 1840 710, 1860 790"
            stroke="#6EE7B7"
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
          />

          {/* ── Secondary branches ── */}
          {/* From Branch A */}
          <path
            d="M 1640 740 C 1600 770, 1520 800, 1420 830"
            stroke="#6EE7B7"
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 1570 780 C 1550 820, 1510 860, 1450 900"
            stroke="#A7F3D0"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
          {/* From Branch B */}
          <path
            d="M 1620 550 C 1570 580, 1490 610, 1380 640"
            stroke="#A7F3D0"
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 1550 590 C 1520 630, 1460 670, 1370 700"
            stroke="#6EE7B7"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
          {/* From Branch C */}
          <path
            d="M 1610 420 C 1550 450, 1460 480, 1340 510"
            stroke="#6EE7B7"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 1500 460 C 1450 500, 1390 530, 1300 550"
            stroke="#A7F3D0"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
          {/* From Branch D */}
          <path
            d="M 1830 700 C 1860 740, 1890 790, 1900 850"
            stroke="#A7F3D0"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 1820 650 C 1860 680, 1890 720, 1910 770"
            stroke="#6EE7B7"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />

          {/* ── Tertiary wisps ── */}
          <path d="M 1500 810 C 1470 830, 1430 840, 1390 850" stroke="#6EE7B7" strokeWidth={2} fill="none" strokeLinecap="round" />
          <path d="M 1420 830 C 1390 850, 1350 860, 1310 865" stroke="#A7F3D0" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          <path d="M 1450 900 C 1420 920, 1390 930, 1350 935" stroke="#6EE7B7" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          <path d="M 1380 640 C 1350 650, 1310 660, 1270 665" stroke="#6EE7B7" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          <path d="M 1370 700 C 1340 715, 1300 725, 1260 730" stroke="#A7F3D0" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          <path d="M 1340 510 C 1300 525, 1260 535, 1210 540" stroke="#A7F3D0" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          <path d="M 1300 550 C 1260 560, 1220 570, 1170 575" stroke="#6EE7B7" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          <path d="M 1480 620 C 1450 635, 1410 645, 1360 650" stroke="#A7F3D0" strokeWidth={2} fill="none" strokeLinecap="round" />
          <path d="M 1420 490 C 1380 505, 1340 515, 1290 520" stroke="#6EE7B7" strokeWidth={2} fill="none" strokeLinecap="round" />
          <path d="M 1860 790 C 1875 830, 1885 870, 1890 910" stroke="#A7F3D0" strokeWidth={2} fill="none" strokeLinecap="round" />
          <path d="M 1900 850 C 1910 880, 1912 910, 1908 940" stroke="#6EE7B7" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          <path d="M 1910 770 C 1925 800, 1930 830, 1928 860" stroke="#A7F3D0" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          {/* Lower canopy wisps */}
          <path d="M 1720 720 C 1690 750, 1650 770, 1610 785" stroke="#6EE7B7" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          <path d="M 1760 600 C 1730 630, 1680 650, 1630 660" stroke="#A7F3D0" strokeWidth={1.5} fill="none" strokeLinecap="round" />

          {/* ── Leaf dots (branch tips) ── */}
          {/* Primary branch tips */}
          <circle cx={1500} cy={810} r={5} fill="#6EE7B7" />
          <circle cx={1480} cy={620} r={5} fill="#A7F3D0" />
          <circle cx={1420} cy={490} r={5} fill="#6EE7B7" />
          <circle cx={1860} cy={790} r={4} fill="#A7F3D0" />

          {/* Secondary branch tips */}
          <circle cx={1420} cy={830} r={4} fill="#A7F3D0" />
          <circle cx={1450} cy={900} r={4} fill="#6EE7B7" />
          <circle cx={1380} cy={640} r={4} fill="#6EE7B7" />
          <circle cx={1370} cy={700} r={4} fill="#A7F3D0" />
          <circle cx={1340} cy={510} r={3.5} fill="#A7F3D0" />
          <circle cx={1300} cy={550} r={3.5} fill="#6EE7B7" />
          <circle cx={1900} cy={850} r={3.5} fill="#6EE7B7" />
          <circle cx={1910} cy={770} r={3.5} fill="#A7F3D0" />

          {/* Tertiary tips */}
          <circle cx={1390} cy={850} r={3} fill="#A7F3D0" />
          <circle cx={1310} cy={865} r={2.5} fill="#6EE7B7" />
          <circle cx={1350} cy={935} r={2.5} fill="#A7F3D0" />
          <circle cx={1270} cy={665} r={2.5} fill="#6EE7B7" />
          <circle cx={1260} cy={730} r={2.5} fill="#A7F3D0" />
          <circle cx={1210} cy={540} r={2.5} fill="#6EE7B7" />
          <circle cx={1170} cy={575} r={2} fill="#A7F3D0" />
          <circle cx={1360} cy={650} r={2.5} fill="#6EE7B7" />
          <circle cx={1290} cy={520} r={2.5} fill="#A7F3D0" />
          <circle cx={1890} cy={910} r={2.5} fill="#6EE7B7" />
          <circle cx={1908} cy={940} r={2} fill="#A7F3D0" />
          <circle cx={1928} cy={860} r={2} fill="#6EE7B7" />
          <circle cx={1610} cy={785} r={2.5} fill="#A7F3D0" />
          <circle cx={1630} cy={660} r={2.5} fill="#6EE7B7" />
        </g>
      </svg>
    </div>
  );
}
