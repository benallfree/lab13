import { createSongPlayer } from 'lab13-sdk'

export const levelEndSong = createSongPlayer([
  'v0vvvx0v0x0zzzzzzz',
  'q0qqqs0q0s0uuuuuuu',
  'j0jjjl0j0l0rrrrrrr',
  '00000000000nnnnnnn',
  '00000000000iiiiiii',
  '00000000000fffffff',
  '00000000000VVVVVVV',
])

export const levels = [
  {
    cat: {
      name: 'Tilly',
      path: 'M90 50 C75 35 105 35 90 20 M75 35 L60 20 M105 35 L120 20 M70 50 C50 70 50 90 70 110 C80 120 100 120 110 110 C130 90 130 70 110 50 M70 110 L60 140 M80 110 L70 140 M100 110 L90 140 M110 110 L100 140 M110 110 C130 130 150 150 170 130 M85 45 C85 45 85 50 85 50 M95 45 C95 45 95 50 95 50 M90 50 L90 60 M85 60 L65 60 M95 60 L115 60',
      bounds: {
        minX: 50,
        minY: 20,
        maxX: 170,
        maxY: 150,
      },
    },
    song: createSongPlayer([
      'll0n0j0jYll00uYvusqs[p0pp00qpnlj0n0q00l0^p00s000v0u0s0pq',
      'ii0j0e0e00i00q000Y^0T00dd000000g0j0n00]00`0000000000d0d',
      '0Y0^000000Y000000000000``000000[0^0]0000000000000000`0`',
    ]),
  },
  {
    cat: {
      name: 'Whiskers',
      path: 'M100 30 C85 15 115 15 100 0 M85 15 L70 0 M115 15 L130 0 M80 30 C60 50 60 80 80 100 C90 120 110 120 120 100 C140 80 140 50 120 30 M80 100 L70 140 M90 100 L80 140 M110 100 L100 140 M120 100 L110 140 M100 100 C120 120 140 140 160 120 M90 25 C90 25 90 30 90 30 M110 25 C110 25 110 30 110 30 M100 30 L100 40 M90 40 L70 40 M110 40 L130 40',
      bounds: {
        minX: 60,
        minY: 0,
        maxX: 160,
        maxY: 140,
      },
    },
    song: createSongPlayer([
      'l0n0j0jYll00uYvusqs[p0pp00qpnlj0n0q00l0^p00s000v0u0s0pq',
      'ii0j0e0e00i00q000Y^0T00dd000000g0j0n00]00`0000000000d0d',
      '0Y0^000000Y000000000000``000000[0^0]0000000000000000`0`',
    ]),
  },
  {
    cat: {
      name: 'Shadow',
      path: 'M100 40 C80 20 120 20 100 0 M80 20 L60 0 M120 20 L140 0 M80 40 C60 60 60 100 80 120 C80 140 120 140 120 120 C140 100 140 60 120 40 M80 120 L70 160 M90 120 L80 160 M110 120 L100 160 M120 120 L110 160 M100 120 C80 140 60 160 40 140 M90 30 C90 30 90 35 90 35 M110 30 C110 30 110 35 110 35 M100 35 L100 45 M90 45 L70 45 M110 45 L130 45',
      bounds: {
        minX: 40,
        minY: 0,
        maxX: 140,
        maxY: 160,
      },
    },
    song: createSongPlayer([
      'in0j0jYll0iuYvusqs^pTppddqpnlj0n0q0nl0^p0`s000v0u0s0pqll',
      '0i0^0e0e00Y00q000Y[0000``000000g0j0]0000000000000000d0d',
      '0Y00000000000000000000000000000[0^000000000000000000`0`',
    ]),
  },
  {
    cat: {
      name: 'Luna',
      path: 'M70 46a24 24 0 1 1 0 48 24 24 0 1 1 0-48M54 58 44 40l20 10Zm32 0 10-18-20 10ZM62 70h4m12 0h4m-14 8 2 2 2-2m-2 2v5m0 0c-4 3-8 3-10 0m10 0c4 3 8 3 10 0M52 74l-22-4m22 8H30m22 4-22 4m58-12 22-4m-22 8h22m-22 4 22 4m-20 14c30 10 50 40 40 70-10 20-50 22-70 0-8-10-6-22 4-30m6-42c8 12 8 32 2 52m0 0 10 20 10-20m28 0c30 0 40-30 20-40-10-4-18 2-16 12 2 14 22 18 32 8',
      bounds: {
        minX: 30,
        minY: 40,
        maxX: 160,
        maxY: 192,
      },
    },
    song: createSongPlayer([
      '0j0jYlleiuYvusqs^p[ppddqpnlj0n0q0nl]^p0`s000v0u0s0pqllin',
      '0Y0^0e0000000q000YT0000``000000g0j000000000000000000d0d',
      '0000000000000000000000000000000[0^000000000000000000`0`',
    ]),
  },
  {
    cat: {
      name: 'Mittens',
      path: 'm90 60 10-20 10 20c20 2 30 20 30 38 2 32-12 62-40 70s-52-12-50-36c2-22 20-34 34-34-14-8-18-20-14-30m14 18h6m18 0h6M96 96l2 2 2-2m-2 2v4m0 0c-4 2-8 2-10 0m10 0c4 2 8 2 10 0M76 92l-20-2m20 6H56m20 4-20 2m48-10 20-2m-20 6h20m-20 4 20 2m-4 48c40 0 44-32 20-38-8 0-10 8-4 12 10 8 20 2 24-6',
      bounds: {
        minX: 48,
        minY: 40,
        maxX: 164,
        maxY: 176,
      },
    },
    song: createSongPlayer([
      'ijYlle0uYvusqs[p0pp0Tqpnlj0n0q0glj^p0gs00`v0u0s0pqlldndj',
      '0Y0^000e00i00p000Y^0000dd000000[0^0^00^0000000000000`0`',
      '0000000000Y000000000000``',
    ]),
  },
  {
    cat: {
      name: 'Pumpkin',
      path: 'm80 60 10-20 10 20c12 2 18 12 18 24 0 16-14 28-28 28s-28-12-28-28c0-12 6-22 18-24m4 22h4m8 0h4m-10 6v4m0 0c-5 3-9 3-12 0m12 0c5 3 9 3 12 0m8 18c30 10 42 38 22 60-20 20-60 18-72-6-6-12 0-26 12-32m6-6v24m8 0v18m38-18c24 0 30-22 12-28-10-4-14 4-10 10 8 12 26 12 34 0',
      bounds: {
        minX: 54,
        minY: 40,
        maxX: 160,
        maxY: 190,
      },
    },
    song: createSongPlayer([
      'vusqsgpgppi0qpnljYn0q00ld^p00s0g0v0u0s[pqll0n0j0j`lld0uY',
      'ii0j0[0000Y0000000^0V00d`000000[0j0l00000^0000000000`0d',
      '0Y0^0000000000000000000`000000000^0`000000000000000000`',
    ]),
  },
  {
    cat: {
      name: 'Nova',
      path: 'm90 54 10-18 10 18c16 4 24 18 24 32 0 20-16 36-34 36s-34-16-34-36c0-14 8-28 24-32m-4 28h6m16 0h6M96 92v6m0 0c-6 4-10 4-14 0m14 0c6 4 10 4 14 0m0 20c30 10 46 38 26 58-20 18-60 16-72-8-6-12 0-28 14-34m-2-4v24m10 0v18m34-18c34 0 42-30 20-36-8 0-10 8-4 12 12 8 26 2 32-8',
      bounds: {
        minX: 58,
        minY: 36,
        maxX: 168,
        maxY: 194,
      },
    },
    song: createSongPlayer([
      'lp0ppd0qpnlj0q0q0[l0ll0n0j0jYllg0u`vusqs^p0Ts000v0u0s0pq',
      'XX0j000^00iV0n0000^0Y00e0000000X0p0n00[00`0000000000d0d',
      '000[000000Y000000000000]000000000^0[0000000000000000`0`',
      '00000000000000000000000Y',
    ]),
  },
  {
    cat: {
      name: 'Cosmo',
      path: 'm120 84 8-18 8 18c14 6 20 20 18 34-4 28-28 46-54 44s-46-24-42-48c2-14 14-24 30-26-12-6-16-18-12-28m16 40h6m16 0h6m-16 8v6m0 0c-6 4-10 4-14 0m14 0c6 4 10 4 14 0m12 26c30 0 38-24 18-30-10 0-12 8-6 12 12 8 28 4 34-6',
      bounds: {
        minX: 54,
        minY: 60,
        maxX: 176,
        maxY: 164,
      },
    },
    song: createSongPlayer([
      'gggiiifffdddgggiiikkknnnpnkpnkrpkrpksrksrkuskuskwwwuuuxxxwwwuspk',
      '000000000000000000fffdddg00g00f00f00p00p00p00p00sssrrrsssrrrk[kf',
      '000000000000000000000000000000c00c00g00g00f00f00pppnnnpppnnnV0g',
      '000000000000000000000000000000000000d00d00c00c00gggfffllliii00_',
      '000000000000000000000000000000000000_00_00_00_00ddd]]]gggfff',
      '000000000000000000000000000000000000000000W00W00___ZZZ```bbb',
      '000000000000000000000000000000000000000000000000[[[VVV[[[ZZZ',
      '000000000000000000000000000000000000000000000000XXX000XXXVVV',
    ]),
  },
  {
    cat: {
      name: 'Ziggy',
      path: 'M60 112c4-16 18-26 36-28l10-18 10 18c16 4 24 16 22 28-2 14-16 22-32 22-14 0-30-6-38-14-2 12-8 22-16 30q-6 6-12 6m46-56h6m16 0h6m-16 8v6m0 0c-6 4-10 4-14 0m14 0c6 4 10 4 14 0m30 18c28-2 32-24 14-30-8-2-10 6-6 12 8 14 24 16 34 6',
      bounds: {
        minX: 40,
        minY: 66,
        maxX: 184,
        maxY: 156,
      },
    },
    song: createSongPlayer([
      'pgkdgkogdssspgkdgkogksssdpkdgkigcsssdgpdgkigcigcdfgfgigiklkigfc',
      'd00000i00igdXXX___d__igc_g_______igc__k]]][[[]]]_][_][SZ[]_][Z]',
      '_00000000000KKKKKK_PP]_`K_KKKKPPP]_`KK_KKKPPPNNNKKKQQQNSSPRSSVW',
      '000000000000000000P00NNN0K0000000NNN00K000000000000MMM0NN',
    ]),
  },
  {
    cat: {
      name: 'Pixel',
      path: 'm78 70 10-18 10 18c18 2 28 16 28 30 0 20-16 36-36 36s-36-16-36-36c0-14 10-28 24-30m-6 22h6m18 0h6m-18 8v6m0 0c-6 4-10 4-14 0m14 0c6 4 10 4 14 0m4 30c24 10 38 32 26 46-16 12-44 8-54-8-6-10-2-24 10-30m36 10c30 0 36-26 18-32-10-2-12 8-6 12 12 8 28 4 36-6',
      bounds: {
        minX: 54,
        minY: 52,
        maxX: 168,
        maxY: 194,
      },
    },
    song: createSongPlayer([
      '00nnnnjeljennnnjeoginlnqqqqjbvjnxnlzzzzsqxxxvsqsqssqsvqsqolqqqqnlvnlsnlusqqlslousqlqqqqsqonln',
      '00ejee00e00ejee00j00j00ljnl00e00o00jjjq00qsqq00cccc00q0oc00lnll00l00l00ilii0o`0qpn0iiii0nliij',
      '00^^^^00]00^^^^00e00^00bbbb00000i00000j00iiig00000000g00000bbbb00c00b00cccc00000`j0eeee0i',
      '00000000000000000`00000000000000000000000000000000000000000000000000000]]]]',
    ]),
  },
]
