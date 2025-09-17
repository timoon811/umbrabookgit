import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdminAuth } from '@/lib/api-auth';

const prisma = new PrismaClient();

export async function POST() {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;



    // Очищаем существующих пользователей
    await prisma.users.deleteMany({});
    
    const allUsers = [
      {
            "id": "cmey694vg0000i82fga7hji1h",
            "email": "admin@umbra-platform.dev",
            "name": "Administrator",
            "password": "$2b$12$w7YrpSGjLiUW5L3hMZwrtelLA7ivcE7hmvkCuOdWoqv7gUSTzKZ/C",
            "telegram": "@admin",
            "role": "ADMIN",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-08-30 08:21:56.716",
            "updatedAt": "2025-08-30 08:21:56.716"
      },
      {
            "id": "cmeya1g4c0000jv2rdq0jt2u2",
            "email": "aa@tmteam.kz",
            "name": "aa aa",
            "password": "$2b$10$Vtokr3FGXw7EbPeIjihSqeANtD1Sy3eqiqjIp2yXrT3fYXAbtYsc.",
            "telegram": "@aaaaaaa",
            "role": "ADMIN",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-08-30 10:07:56.508",
            "updatedAt": "2025-08-30 11:00:10.851"
      },
      {
            "id": "cmezz8dd00003mx2mo0t2d6la",
            "email": "mailforavttttr@gmail.com",
            "name": "Kastl Kastl",
            "password": "$2b$10$abqTinXSM57v6pDPS9oX8uPHFRkksRIqOgkHn9vtFfFCPLtcCrRqK",
            "telegram": "@glory13376",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-08-31 14:40:56.101",
            "updatedAt": "2025-09-02 13:02:22.694"
      },
      {
            "id": "cmezz8x1u0004mx2mp3d8l3qx",
            "email": "kondensinsert@gmail.com",
            "name": "kondensator",
            "password": "$2b$10$ZybMC6fG0TVFbgdZP2xKcuEkHJ2POWOKDTQtLm3RLve2PgIBe/aIq",
            "telegram": "@kodertg",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-08-31 14:41:21.619",
            "updatedAt": "2025-09-02 13:03:18.272"
      },
      {
            "id": "cmezzcich0005mx2mzspwhtmj",
            "email": "dghol1998@gmail.com",
            "name": "Давид",
            "password": "$2b$10$FDzHHGIYsjXhizeslFEb9eoOJhwZY/G10FhvmdYyDkmvvcsRHUOoS",
            "telegram": "@c6hog",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-08-31 14:44:09.186",
            "updatedAt": "2025-09-02 13:02:59.84"
      },
      {
            "id": "cmezzi1ia0006mx2m8w1o7n4s",
            "email": "cqustgame@gmail.com",
            "name": "Давид",
            "password": "$2b$10$4/e3HT/GQ52PJ84cok8Tw.dXwA34NGp4/JBnYOn9RiI15MnpaOgFa",
            "telegram": "@shtenze",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-08-31 14:48:27.298",
            "updatedAt": "2025-09-02 13:03:15.381"
      },
      {
            "id": "cmezzt0tj0007mx2m1obqol7k",
            "email": "looovvveeemeee208@gmail.com",
            "name": "Олег Лабанов",
            "password": "$2b$10$YVU/N8KXKOLfiMvUiXA00.FeDOqR4UFtaO5rXp2zPHUsWcIEbLMtG",
            "telegram": "@iloveth1slife",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-08-31 14:56:59.623",
            "updatedAt": "2025-09-02 13:03:13.288"
      },
      {
            "id": "cmezztv7t0008mx2mwlj3do07",
            "email": "gagahahha@yandex.ru",
            "name": "джон сина",
            "password": "$2b$10$GwIoPAdvCOltUrI7s5refuccrD6a5b8Et2KQ1sODNtPl/BDePuv6y",
            "telegram": "@vortinkof",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-08-31 14:57:39.017",
            "updatedAt": "2025-09-02 13:02:56.266"
      },
      {
            "id": "cmezzx8480000q12l7qcwe0sc",
            "email": "maximumpayne333@gmail.com",
            "name": "Джек Трисмегист",
            "password": "$2b$10$MF4QwQANsC8kg/kh8LTyBuPN.bqeKjfjyyc1qM8lRd6kndZtZ6toK",
            "telegram": "@youung_thhoompson",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-08-31 15:00:15.704",
            "updatedAt": "2025-09-02 13:02:53.787"
      },
      {
            "id": "cmezzzn9g0001q12lulvmc1gk",
            "email": "pasha.seli@yandex.ru",
            "name": "All Cash",
            "password": "$2b$10$xWyPlwVGufQpmwZPrhaew.ol8ur8Kmd3DKlQRGOerjo/i4hUSe2nu",
            "telegram": "@allcasheu",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-08-31 15:02:08.645",
            "updatedAt": "2025-09-02 13:02:46.685"
      },
      {
            "id": "cmezzzuk40002q12l5sp0dwsb",
            "email": "dfsdf@gmail.com",
            "name": "ываывавы",
            "password": "$2b$10$SXUKXClEnzqtXjiLVmF12efpqVoog1kQnrUQ0yFVXgOyBB11gm952",
            "telegram": "@qweqwe",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-08-31 15:02:18.1",
            "updatedAt": "2025-09-02 13:02:49.478"
      },
      {
            "id": "cmf003et00003q12l2qc1n55e",
            "email": "vityna@gmail.com",
            "name": "Витюня",
            "password": "$2b$10$6rKa.C0EMsbeB5veuAPdsu.2vJOpjSA7gLwpYPYdviM0Qj2qfzb9a",
            "telegram": "@viktor",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-08-31 15:05:04.309",
            "updatedAt": "2025-09-02 13:02:44.364"
      },
      {
            "id": "cmf005ilm0004q12lt3ntozyg",
            "email": "astrelias2003@gmail.com",
            "name": "Elijah Str",
            "password": "$2b$10$fCJ3cbn0zvk5DLPcubzyn.XOJwCoUtGIA3uGXBFMFP4ZryhQ43Kae",
            "telegram": "@elghmwacc",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-08-31 15:06:42.538",
            "updatedAt": "2025-09-02 13:02:42.132"
      },
      {
            "id": "cmf00bvlu0005q12ljfcfvnpf",
            "email": "katalan.@gmail.com",
            "name": "Parabellum",
            "password": "$2b$10$wvgCrndX3wkktrAU2xn38OTbR1zOmHyxzh9ThVUo.YVQ3IxMwF/5i",
            "telegram": "@iopwork",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-08-31 15:11:39.33",
            "updatedAt": "2025-09-02 13:02:51.739"
      },
      {
            "id": "cmf00z0gg0000l82tk8wxp0zt",
            "email": "brownvalentine997@gmail.com",
            "name": "Povlovich",
            "password": "$2b$10$.SKbdAxboHIpjzxLXhFJTuEu1GEZAvL8oejWQeiLDeA1NmDN/hFzO",
            "telegram": "@povlovich",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-08-31 15:29:38.704",
            "updatedAt": "2025-09-02 13:02:39.769"
      },
      {
            "id": "cmf01hv910000lo2lc9mwt633",
            "email": "azuzekmr@pm.me",
            "name": "Privet",
            "password": "$2b$10$rpIiWkVQdsx7ECBqGYC41.9lJU4RAeZQrLvgemu6OUpKeb6u9.IUW",
            "telegram": "@privetppoka",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-08-31 15:44:18.421",
            "updatedAt": "2025-09-02 13:02:36.287"
      },
      {
            "id": "cmf04stb80000l22mtbo7shmv",
            "email": "klakan@proton.me",
            "name": "Cesar",
            "password": "$2b$10$mA/hk9pMe5OM6T/dhNvbJOpzcVtwUGLbbCaahu872E3ws9sUQWd0i",
            "telegram": "@memento_mori_148",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-08-31 17:16:47.973",
            "updatedAt": "2025-09-02 13:02:25.234"
      },
      {
            "id": "cmf0ou26b0000nw2n9lf6anut",
            "email": "ananas.bebra@mail.ru",
            "name": "Василий Курашов",
            "password": "$2b$10$Wiow.f5O3gpZKtmCY2IVj.6PqtcV7IOHTHG3hnMzgH/pmcwcgS.22",
            "telegram": "@mazzdasor",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-01 02:37:38.435",
            "updatedAt": "2025-09-02 13:02:32.589"
      },
      {
            "id": "cmf0p3t0u0001nw2n60q1w6jt",
            "email": "yelisey123123123@gmail.com",
            "name": "obigizeee",
            "password": "$2b$10$gaz.VXrcAVuueQwidXnvse2.cXzm2f4xil/RzhfccwOmN74qQFrgK",
            "telegram": "@joohjijamammoto",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-01 02:45:13.135",
            "updatedAt": "2025-09-02 13:02:29.916"
      },
      {
            "id": "cmf0t4v9d0002nw2nm05lofbi",
            "email": "jeriver941@noidem.com",
            "name": "kyc",
            "password": "$2b$10$NPzKM6dDjUR1ziljZpnSoeDmorwGqUex/gCJYQGuy1tZBv8PsrEx6",
            "telegram": "@ddw25043",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-01 04:38:01.153",
            "updatedAt": "2025-09-02 13:02:27.368"
      },
      {
            "id": "cmf0y9bai0003nw2nib5sid2g",
            "email": "sondracurry1@gmail.com",
            "name": "Mercury",
            "password": "$2b$10$DvjmmFiV1FkwHI0qyZDKVOll9HMEflLJMYgWIfT8lC.AnldJgTXVG",
            "telegram": "@mercury_link",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-01 07:01:26.634",
            "updatedAt": "2025-09-02 13:03:11.184"
      },
      {
            "id": "cmf0ybfww0004nw2nnayxhcvo",
            "email": "gaztutu@gmail.com",
            "name": "Ben",
            "password": "$2b$10$h7MvPlBWMWhMibItWtvwXeUEGakz2j69vHUDoOiA6OcdetK0rGyo6",
            "telegram": "@user53411",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-01 07:03:05.936",
            "updatedAt": "2025-09-02 13:03:08.149"
      },
      {
            "id": "cmf0yd2c40005nw2nv1m0hq5g",
            "email": "vasiapupkintop977@gmail.com",
            "name": "Роман",
            "password": "$2b$10$nsQ/OvnVFFk6g5SN3.MD3uIyfBxrnrdGQr445dBa7YZzQPpWxZkK6",
            "telegram": "@rdsrtv",
            "role": "PROCESSOR",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-01 07:04:21.652",
            "updatedAt": "2025-09-07 18:19:37.864"
      },
      {
            "id": "cmf1ju51n0000l22sehhffmk5",
            "email": "wildboarsgeorgy@gmail.com",
            "name": "похотливый мс",
            "password": "$2b$10$dHX.sLYqqQIgdze/L2pGg.YkjN6alahw62WlZ6eXG/lBMHMbsBf4K",
            "telegram": "@samesigned",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-01 17:05:30.252",
            "updatedAt": "2025-09-02 13:03:02.354"
      },
      {
            "id": "cmf1m2dvk0001l22sqgk6xlww",
            "email": "peekaboo1444@gmail.com",
            "name": "Талгат",
            "password": "$2b$10$uMWLblx3mLaX9S7B4lylv.9fcUQg2feBsfjb40PUOcrIbK5aih2m6",
            "telegram": "@talgat010",
            "role": "PROCESSOR",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-01 18:07:54.177",
            "updatedAt": "2025-09-01 18:25:54.165"
      },
      {
            "id": "cmf1m2x350002l22s8tja1in6",
            "email": "talgat.k-26@mail.ru",
            "name": "Talgat",
            "password": "$2b$10$gqDjTeioCjj/MjZQPJVP1evCZ0ic3f5aHKGvdHKwet4XcvvdlZ4IW",
            "telegram": "@talgat0100",
            "role": "USER",
            "status": "REJECTED",
            "isBlocked": false,
            "createdAt": "2025-09-01 18:08:19.073",
            "updatedAt": "2025-09-01 18:08:34.572"
      },
      {
            "id": "cmf1mxf5n0000i52mdac5ncu4",
            "email": "almaz.0431@gmail.com",
            "name": "Almaz",
            "password": "$2b$10$SqNwsPBJIuMlUJiWEEKZRuAw3ANHTHOMrhseHUQoc8VIyEVM799iO",
            "telegram": "@traff_killer",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-01 18:32:02.171",
            "updatedAt": "2025-09-02 13:02:18.671"
      },
      {
            "id": "cmf1nx4k90000os2uo291sxje",
            "email": "zhanbota.education@gmail.com",
            "name": "Lyapotaaaa",
            "password": "$2b$10$dY3yoTKMNgm2opxS335kuOx/t0zuPKQp8CrLrX49lQDQw7UL9z3F.",
            "telegram": "@lyapotaaaaa",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-01 18:59:48.057",
            "updatedAt": "2025-09-02 13:02:16.309"
      },
      {
            "id": "cmf1on3xi0000n42sn3v7i2ik",
            "email": "zelenvol15@gmail.com",
            "name": "cima",
            "password": "$2b$10$40d8lpIfzyLU3sDFB.rhdOlhqkemhVRQn0xv5QU0XKxkJQEpq7aWi",
            "telegram": "@cimexs",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-01 19:20:00.295",
            "updatedAt": "2025-09-02 13:02:14.204"
      },
      {
            "id": "cmf1q4r3w0001n42s72rnf0ak",
            "email": "xmr1488@gmail.com",
            "name": "Oleksandr",
            "password": "$2b$10$/Y0NUMqSqJck0YkdppDkxeMZLtG87omjjvlpwLcVRKbtG216eYB3m",
            "telegram": "@imposya88",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-01 20:01:43.1",
            "updatedAt": "2025-09-02 13:02:12.345"
      },
      {
            "id": "cmf25f3x10002n42sc4xr135d",
            "email": "kimxbeng@gmail.com",
            "name": "Lyuto",
            "password": "$2b$10$f3zO10pjmxyiil3kx8izDOGUYOAVSc9TJYGJq.1g1WeQwHO51IBXe",
            "telegram": "@lyuto2",
            "role": "PROCESSOR",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-02 03:09:40.501",
            "updatedAt": "2025-09-08 15:51:46.74"
      },
      {
            "id": "cmf264jlm0003n42syhgyid44",
            "email": "lannt050@gmail.com",
            "name": "lannt",
            "password": "$2b$10$j/DUv.NiRbfo1dH3nknxue/Us9jYg4dsXVKvoRv8AXR3jT0Iugpnq",
            "telegram": "@lannt12",
            "role": "ADMIN",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-02 03:29:27.226",
            "updatedAt": "2025-09-03 13:47:28.937"
      },
      {
            "id": "cmf29ders0004n42sfdd5k15p",
            "email": "sskweezy@proton.me",
            "name": "Леша Свитолин",
            "password": "$2b$10$mZnnoXSoNxRzD6cX6aLhw./4W53G2z4Sbn9XsMPeHcGiHcQ4pw/Fu",
            "telegram": "@ffrmqr",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-02 05:00:19.72",
            "updatedAt": "2025-09-02 13:02:08.008"
      },
      {
            "id": "cmf2abg8f0005n42s2ajgu1x5",
            "email": "elpatcha66@gmail.com",
            "name": "Hephap",
            "password": "$2b$10$s8aLRLFwLiugI7/NVWK8wunyHjl/Db4tzpyr9cKBArl39LwkXDCta",
            "telegram": "@romashkalolol",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-02 05:26:47.92",
            "updatedAt": "2025-09-02 13:02:05.97"
      },
      {
            "id": "cmf2frzlu0006n42s1nuklj9r",
            "email": "rostirollasalik@gmail.com",
            "name": "green edge",
            "password": "$2b$10$bFSS1mqB2B8M6TQq1SWxM.mlY8Eox0M6IuYx0q.FbiIUE.dec8oCq",
            "telegram": "@mychemplon",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-02 07:59:37.603",
            "updatedAt": "2025-09-02 13:02:03.739"
      },
      {
            "id": "cmf2ggvow0007n42sigmmr6tj",
            "email": "boomius67@gmail.com",
            "name": "Даниил",
            "password": "$2b$10$31pwkZbfG3q4GG.zUrsVn.qRPSc6/cHKZKrCFrf0zGel5sA0CsSpm",
            "telegram": "@chaoztg",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-02 08:18:58.929",
            "updatedAt": "2025-09-02 13:02:01.493"
      },
      {
            "id": "cmf2gxnux0008n42svwfkv75b",
            "email": "luxurykilldd@gmail.com",
            "name": "Эл",
            "password": "$2b$10$5sjIZ/jzlffos4ft6lvRW.QDBHyjyXEISAYBCAhu1iijnQxKtdgO6",
            "telegram": "@tg_piug",
            "role": "PROCESSOR",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-02 08:32:01.929",
            "updatedAt": "2025-09-08 15:18:50.072"
      },
      {
            "id": "cmf2hg67z0009n42sa5yz2dgg",
            "email": "godddamn992@gmail.com",
            "name": "whotfareyou",
            "password": "$2b$10$Y8q98B4OZA9mkZwpSHvx0uIHSiGeZsKmpMSy9k/K3A59kfn03hzhi",
            "telegram": "@etna_vera_vela",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-02 08:46:25.535",
            "updatedAt": "2025-09-02 13:01:57.246"
      },
      {
            "id": "cmf2hp6g0000an42scgur7e0p",
            "email": "osnova950@gmail.com",
            "name": "Oznzo",
            "password": "$2b$10$kh4X50PmIA1zCpvzlJA6WOJ.fDlUe3.z0eiz2ikF627kaBcrpdWhS",
            "telegram": "@ozoxocc",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-02 08:53:25.728",
            "updatedAt": "2025-09-02 13:01:55.065"
      },
      {
            "id": "cmf2k9lg7000bn42sy64uwgp4",
            "email": "rtty9718@gmail.com",
            "name": "Ivan Ivanov",
            "password": "$2b$10$vPyIJr/wP06dNviHXshHJezimdcRWDcCeOhPlkzpZ6oI8bYqpVq5K",
            "telegram": "@bl444ck",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-02 10:05:17.528",
            "updatedAt": "2025-09-02 13:01:52.161"
      },
      {
            "id": "cmf2kr963000cn42s35bia693",
            "email": "ccc@xyu.kz",
            "name": "Caroline",
            "password": "$2b$10$x/q0dqBcKwb3bBB2vgrhY.5Fn222yuZtgVXA1EYPkadksYHfezP3q",
            "telegram": "@hennessyo",
            "role": "ADMIN",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-02 10:19:01.42",
            "updatedAt": "2025-09-12 16:07:37.546"
      },
      {
            "id": "cmf30oj7o000dn42sq1xmlp2l",
            "email": "tataracom8@gmail.com",
            "name": "Олег Мальков",
            "password": "$2b$10$Db12qmOiXFGCjwldqninuezDrGQ20260J5r5CoDjHhlvQJvy6T0vO",
            "telegram": "@maf1c",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-02 17:44:48.324",
            "updatedAt": "2025-09-03 03:41:30.232"
      },
      {
            "id": "cmf3425dd000en42swr93axgn",
            "email": "sgshdvdhh@gmail.com",
            "name": "Alex",
            "password": "$2b$10$884IciX9rN1CWd3SWxGIPeu/s5MhcFb.wYvN9g5xx4BfMtwdULua6",
            "telegram": "@bdbdhhd",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-02 19:19:22.417",
            "updatedAt": "2025-09-03 03:41:27.53"
      },
      {
            "id": "cmf3nmscx000fn42sqxfoektr",
            "email": "gaoyong0915@gmail.com",
            "name": "gaoyong",
            "password": "$2b$10$6Nup4oWsdQPz.zeKA8HxPu2JiB2SDgS1pF.gbGV60wa9OYbviqsOC",
            "telegram": "@black_shackle",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-03 04:27:18.033",
            "updatedAt": "2025-09-03 06:54:30.392"
      },
      {
            "id": "cmf3pk7ia000gn42s05usq1sf",
            "email": "v00693249@gmail.com",
            "name": "Сергей",
            "password": "$2b$10$kvY6LBlNJFK7TiBTgigu.OEvNRm72LnYmFHW3fBkA4xfTb9PHVhha",
            "telegram": "@sergeuuio",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-03 05:21:16.931",
            "updatedAt": "2025-09-03 06:54:27.503"
      },
      {
            "id": "cmf3sw63o000hn42s5znwsda6",
            "email": "lackysbrunosamp@gmail.com",
            "name": "Иван Иванаов",
            "password": "$2b$10$DqCYrgT9c8sfZ4CAxQml9ewz22Dq7fVX5XA1O5I2BxsCeKbibGr1u",
            "telegram": "@skermam",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-03 06:54:33.828",
            "updatedAt": "2025-09-03 07:02:15.818"
      },
      {
            "id": "cmf445yz5000in42s3odrc5un",
            "email": "licijomyjored@gmail.com",
            "name": "4realz",
            "password": "$2b$10$ya5cImtvRSYeKnaXLM4j9u5Wxf/E62aSS/v1zVwUKDj6rENkzdF7u",
            "telegram": "@for_realz",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-03 12:10:06.93",
            "updatedAt": "2025-09-03 13:47:11.873"
      },
      {
            "id": "cmf44ske6000jn42so0245o3f",
            "email": "un1onfnn@gmail.com",
            "name": "alex union",
            "password": "$2b$10$KZYIUbnX5xDorLyKKf4BfuF3wRFFKnUEcX8S9Aqcg097bIIsavg4i",
            "telegram": "@un1onn",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-03 12:27:41.118",
            "updatedAt": "2025-09-03 13:47:09.019"
      },
      {
            "id": "cmf49x6p70001n22mvbi5zav5",
            "email": "wihatof806@lanipe.com",
            "name": "noname228",
            "password": "$2b$10$hujYQpF0Jjg40juCgw/9Reh7OQVGRauGlzWR51Bj5WBm4/jjSXpbu",
            "telegram": "@https://t.me/moralisty",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-03 14:51:14.731",
            "updatedAt": "2025-09-03 15:21:30.905"
      },
      {
            "id": "cmf55qcmp0000l42mqmd0xr8e",
            "email": "funandrun45@gmail.com",
            "name": "Андрей",
            "password": "$2b$10$MYv4AlW1e11QJn.xenYui.ByRvRqR3K.DideghaQbOVLFlg1XtkU.",
            "telegram": "@zahlebish",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-04 05:41:43.537",
            "updatedAt": "2025-09-04 12:59:27.771"
      },
      {
            "id": "cmf59o5860001l42m9md0etyw",
            "email": "micalo2734@lanipe.com",
            "name": "Gendaii Voronov",
            "password": "$2b$10$0AZ/hwftb8Fhgr0z.NbIAOECMmrZi4ucniEvXJE0RAu.OnOPag8Du",
            "telegram": "@bembem14m",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-04 07:31:59.095",
            "updatedAt": "2025-09-04 12:59:25.463"
      },
      {
            "id": "cmf59p3tg0002l42m7lqnsccd",
            "email": "ofmanagerchatsss@gmail.com",
            "name": "Gnom",
            "password": "$2b$10$i.p7e6TcLjaXE4OIqvRnuO7nm4szzbW9kheAiUqr0Cb6RyKnSUbj2",
            "telegram": "@https://t.me/gnomiktt",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-04 07:32:43.924",
            "updatedAt": "2025-09-04 12:59:22.975"
      },
      {
            "id": "cmf5iko7q0003l42mnu0s4tv6",
            "email": "filatov-54cvl@rambler.ru",
            "name": "1 12",
            "password": "$2b$10$evy6jKMSD4ZS2EvwtBBeo.ynVzvF9umD0nrL6bgLklLg0JISqU7Fa",
            "telegram": "@https://t.me/wgorrrr",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-04 11:41:13.622",
            "updatedAt": "2025-09-04 12:59:20.42"
      },
      {
            "id": "cmf5rgds40004l42mhloybxtp",
            "email": "yakrutoi2209@gmail.com",
            "name": "Андрей Андреевич Фурман",
            "password": "$2b$10$hBhVTqCU5IpoL4vPptg52eLB8BadVSndU/LFKIHIUC0Iy6eON3czm",
            "telegram": "@nedovolen8",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-04 15:49:50.02",
            "updatedAt": "2025-09-04 16:05:53.627"
      },
      {
            "id": "cmf5rgjbj0005l42mnpkv45cl",
            "email": "antonshkagusev8888@gmail.com",
            "name": "Попа",
            "password": "$2b$10$m.TofS5JfM5WgM5VTRIp8ewGguPi/Vrh2TUhDTHbcSCkFFEN6zXPm",
            "telegram": "@antonshter",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-04 15:49:57.199",
            "updatedAt": "2025-09-04 16:05:51.515"
      },
      {
            "id": "cmf5s0m3r0006l42m58te4p42",
            "email": "tsoul410@gmail.com",
            "name": "Кандратьев",
            "password": "$2b$10$b1C8pxxS2YZc3.xoTKvZCuJG7NX5mYz97Z.d96DQ8mkmraqwx32iS",
            "telegram": "@wia453",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-04 16:05:33.927",
            "updatedAt": "2025-09-04 16:05:49.032"
      },
      {
            "id": "cmf5sqj240007l42m2790tpdy",
            "email": "asdw20011@gmail.com",
            "name": "Danil",
            "password": "$2b$10$UTnYS5zEZGgn6jC9KOMjteCm67s7YK9fHQw7p9HjiELeiJQY9SGl.",
            "telegram": "@asdw20011",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-04 16:25:43.037",
            "updatedAt": "2025-09-04 16:50:55.143"
      },
      {
            "id": "cmf5ss6xd0008l42mx1vufuon",
            "email": "no@gmail.com",
            "name": "________________________",
            "password": "$2b$10$dGzKriR6.8YcKLRrpmhsQ.pMjyQgXaC6aBkPzFm24MxSmcflCfcde",
            "telegram": "@whoareeee",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-04 16:27:00.625",
            "updatedAt": "2025-09-04 16:50:52.006"
      },
      {
            "id": "cmf5tob3j0009l42m20k9hqym",
            "email": "xuyxuy836@gmail.com",
            "name": "Gena",
            "password": "$2b$10$OsqOW8syEg4RUCTmpDMNlOgiyLLy8vVMX2Fc0os65doV/nnTGcn3G",
            "telegram": "@gena_159",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-04 16:51:59.023",
            "updatedAt": "2025-09-04 16:54:46.708"
      },
      {
            "id": "cmf5uj8tg0000mf2lg91chv3s",
            "email": "randomemail@gmx.de",
            "name": "Геннадий Вячеславкин",
            "password": "$2b$10$wuIv2qhgtUYE/274xmjLA.XbryDGZko/zIlwBwDIH3Eu8TGV9Ozve",
            "telegram": "@lvlrockstar49",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-04 17:16:02.405",
            "updatedAt": "2025-09-04 17:53:06.877"
      },
      {
            "id": "cmf5v0wbt0001mf2l9fy55234",
            "email": "generosodidenaro@outlook.com",
            "name": "Giorgio Armani",
            "password": "$2b$10$WOXwqeqyAg3xe9u10.WxuukDDEhICFm725Mo/jzX.uDIMNixVSneK",
            "telegram": "@giorgiowork",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-04 17:29:46.025",
            "updatedAt": "2025-09-04 17:53:02.655"
      },
      {
            "id": "cmf60ifnj0002mf2lbw8pabod",
            "email": "zorr7692@gmail.com",
            "name": "Дима",
            "password": "$2b$10$Z1oa7eiH.h5FnMuzJKo5RewSSyhnjNEfP/3pvkoO25e9jDbfqM.Pq",
            "telegram": "@zorra03",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-04 20:03:22.303",
            "updatedAt": "2025-09-05 14:15:26.428"
      },
      {
            "id": "cmf60tdna0003mf2l58a8jmpc",
            "email": "dark@us.fn",
            "name": "Gamer",
            "password": "$2b$10$BUar7ESYNsmHGrl/kh4HQOl8JCBVL/8sjoEYSdApiyHrUxKLE.e5m",
            "telegram": "@greyxsup",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-04 20:11:52.919",
            "updatedAt": "2025-09-05 14:15:23.933"
      },
      {
            "id": "cmf65eyah0004mf2lrrezq55i",
            "email": "cloudfame1337@gmail.com",
            "name": "Иван Ебланов",
            "password": "$2b$10$bvYAAqtwnWix5C/WhgA/QuePAKB/dUj9RcKs0FGDtRYVO3M0nLDRS",
            "telegram": "@cloudfame1337",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-04 22:20:37.914",
            "updatedAt": "2025-09-05 14:15:21.739"
      },
      {
            "id": "cmf6a7opq0005mf2l4u9miyf1",
            "email": "mongouser@outlook.com",
            "name": "zachem fio",
            "password": "$2b$10$svIgG1vAEWRy6eExQGY91OpnVdRBk5eakrmWRcSI9Ei9iTkwUPWZO",
            "telegram": "@krkn_dose",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-05 00:34:56.99",
            "updatedAt": "2025-09-05 14:15:18.449"
      },
      {
            "id": "cmf6ey1zl0006mf2lq5aaoo8t",
            "email": "7cmgm@powerscrews.com",
            "name": "Петр Топлес",
            "password": "$2b$10$Afe56RkLT.WKxQKno6CgYujjvr.WExwBLU/HvtnXW4Hs/EXn.6Lri",
            "telegram": "@cardinalgr",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-05 02:47:25.713",
            "updatedAt": "2025-09-05 14:15:16.076"
      },
      {
            "id": "cmf6im55z0007mf2ltnnv1uor",
            "email": "youwantmyface1@gmail.com",
            "name": "Хунсос",
            "password": "$2b$10$jnTVh2wHbBV4IXepcJ0ei.9HoMz8WB/NVpcUKYeHRJ15n6B.7S0wi",
            "telegram": "@esface",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-05 04:30:08.423",
            "updatedAt": "2025-09-05 14:15:13.243"
      },
      {
            "id": "cmf6nyyfn0008mf2lf5xebope",
            "email": "maksimhov@gmail.com",
            "name": "Максипм",
            "password": "$2b$10$.lm79EAwE6gFtlvvINSBl.IMUqIO/MIvsJHYn6Z90NhPEjrTSzYpG",
            "telegram": "@willerggs",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-05 07:00:04.307",
            "updatedAt": "2025-09-05 14:15:10.825"
      },
      {
            "id": "cmf6s6pdr0009mf2l3270et5o",
            "email": "rloyl@vk.com",
            "name": "Rufat Sadr",
            "password": "$2b$10$jPzUBiKiO31AcZlAE8Pmje1vski7XBdvqxqPyIqx.VOXozPsUl5jO",
            "telegram": "@rufatus",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-05 08:58:04.288",
            "updatedAt": "2025-09-05 14:15:08.394"
      },
      {
            "id": "cmf6w8wcq000amf2l5eakgdke",
            "email": "h0hoojkmwl9b@taoxuent.com",
            "name": "pencil pencil",
            "password": "$2b$10$zRJLib3tomCchJfL14B2JOvewteF3RdUtiSAmKhREu.PfrGpJtwdu",
            "telegram": "@moneyhodf",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-05 10:51:45.098",
            "updatedAt": "2025-09-05 14:15:05.929"
      },
      {
            "id": "cmf6xv2id000bmf2lb6nvc3n1",
            "email": "zoeroll524@gmail.com",
            "name": "Artem Artemov",
            "password": "$2b$10$5uxmWZZ/AXzdH79.LP3tSOSlAOjUKQj0unic0/RUqrYfgV2awLl.K",
            "telegram": "@dxqxsx",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-05 11:36:59.125",
            "updatedAt": "2025-09-05 14:15:02.798"
      },
      {
            "id": "cmf6yn2fs000cmf2letffu55t",
            "email": "deekeypipipu@gmail.com",
            "name": "Виктор Сигма",
            "password": "$2b$10$5iROArYKpmUiX3eN0bE7KOnBuHsnW.CzPd.pLjlCGS.mAmRPYXPz2",
            "telegram": "@ghiiiillppp",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-05 11:58:45.4",
            "updatedAt": "2025-09-05 14:14:59.388"
      },
      {
            "id": "cmf76nexa000dmf2lavm6g655",
            "email": "upopopo829@gmail.com",
            "name": "b b",
            "password": "$2b$10$iGQeglhojuo4GMAT932fCujzQP.YBuK/9a6RHnHP5auE3DhrfjenO",
            "telegram": "@gogo123asd",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-05 15:42:58.511",
            "updatedAt": "2025-09-06 13:40:47.896"
      },
      {
            "id": "cmf7dnjww000emf2ltz8mztih",
            "email": "dienamars@gmail.com",
            "name": "Андрей Шамов",
            "password": "$2b$10$CIO5CQZeu3guRNDqDQBRWeYvd0vYFl9gSPCgHVzvXSmIKLZQt6emi",
            "telegram": "@dienamars",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-05 18:59:02.289",
            "updatedAt": "2025-09-06 13:40:44.189"
      },
      {
            "id": "cmf7ecwlk000fmf2lrn67izkd",
            "email": "sven98mannikor@proton.me",
            "name": "Yes Choppski",
            "password": "$2b$10$IlU.7ojJeF4Itrk50jZMUOHr8Kxgw9JdrYeOR2VnxZxbTysPhwMki",
            "telegram": "@https://t.me/yeschoppskiii",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-05 19:18:45.129",
            "updatedAt": "2025-09-06 13:40:41.82"
      },
      {
            "id": "cmf7g8vt9000gmf2l0930n1di",
            "email": "therifachannel@gmail.com",
            "name": "Emil",
            "password": "$2b$10$GeBKW8JGCskDYs2EdCDH7OqDFoUYHAmp4idJmN5kJiEEE5JuPrZs2",
            "telegram": "@xkhatai",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-05 20:11:36.718",
            "updatedAt": "2025-09-06 13:40:39.787"
      },
      {
            "id": "cmf7kan18000hmf2liq2fizz6",
            "email": "blazerussialow@gmail.com",
            "name": "Андрей",
            "password": "$2b$10$i63uCn28TzgtOZ8TXkUdqORRR6qidXglxiSgpp5wUJCbEH5XU2u8e",
            "telegram": "@blazerussialow@gmail.com",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-05 22:04:57.116",
            "updatedAt": "2025-09-06 13:40:37.595"
      },
      {
            "id": "cmf84ufam000imf2lf97kz9vx",
            "email": "363aquamarine@powerscrews.com",
            "name": "erano",
            "password": "$2b$10$NxHxM42Jg1YPYfzYhq.Sau/htrKaMVW.fTkbUlbnxXrfJKX9JNBmu",
            "telegram": "@skilzzz",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-06 07:40:12.527",
            "updatedAt": "2025-09-06 13:40:34.905"
      },
      {
            "id": "cmf861kcm000jmf2l82m137xr",
            "email": "iaia233@mail.ru",
            "name": "Максим Князев",
            "password": "$2b$10$DVOWn5lez7euPB/7KxIuP.Bp4NRkF1EyVJloe233hH4WjVdpQPgb2",
            "telegram": "@prrezalito",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-06 08:13:45.286",
            "updatedAt": "2025-09-06 13:40:32.397"
      },
      {
            "id": "cmf88hwog000kmf2lddx40j0x",
            "email": "ethan.bronkss@gmail.com",
            "name": "Ethan",
            "password": "$2b$10$oBcxVw2uOcqj8eyHGFEGyuElsmUEoxG9ciafgNoE4mdGhBa3FR4MC",
            "telegram": "@bitmarw",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-06 09:22:26.992",
            "updatedAt": "2025-09-06 13:40:30.159"
      },
      {
            "id": "cmf8ccb99000lmf2lgqy9den7",
            "email": "richardsswen@hotmail.com",
            "name": "Kirill K",
            "password": "$2b$10$tATfCrdIeI.xIMEs424xde0ILXDM0hepmV3Y64KmWW/XEKsAy7BZq",
            "telegram": "@swaggerr272",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-06 11:10:04.413",
            "updatedAt": "2025-09-06 13:40:28.012"
      },
      {
            "id": "cmf8f52sv000mmf2laweuiucr",
            "email": "pfijsdipf@gmail.com",
            "name": "fsdfsdf",
            "password": "$2b$10$/JiIeaSml1M3z0KoB7FV6eOOBQXYuRXsxEmWf9/8tR8SwZQSZ8ntm",
            "telegram": "@usnrasjtg227",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-06 12:28:25.712",
            "updatedAt": "2025-09-06 13:40:25.697"
      },
      {
            "id": "cmf8fepsq000nmf2lsjyg8m04",
            "email": "nojaf98867@mirarmax.com",
            "name": "Арсен Маркарян",
            "password": "$2b$10$UFv5SReHSLCo0XMoFEki..0yQevS7dGhSa7CHc6kX6G3K8OSL6wYq",
            "telegram": "@razinnf",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-06 12:35:55.418",
            "updatedAt": "2025-09-06 13:40:23.274"
      },
      {
            "id": "cmf8fjqkc000omf2ls5iehwd8",
            "email": "ggferretggg@gmail.com",
            "name": "Никита Хорьков",
            "password": "$2b$10$M.m2aDtJNrnTmBX95d.pOOs66nVhRLD8Kbzp93kEWPWnwY1ZgM8iK",
            "telegram": "@ggggferret",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-06 12:39:49.692",
            "updatedAt": "2025-09-06 13:40:20.006"
      },
      {
            "id": "cmf8hvmxi000pmf2l9oxh1m6g",
            "email": "danagorod04@gmail.com",
            "name": "Абат Бекбусинов",
            "password": "$2b$10$qna8ou.SSrmdsTUuCEC/r.HNnTNPoAi7sqtmOAae4YcQXkgl7RjyK",
            "telegram": "@lolerbousint",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-06 13:45:04.086",
            "updatedAt": "2025-09-06 13:47:48.39"
      },
      {
            "id": "cmf8imknr000qmf2lggtjfnrm",
            "email": "karensumter1972@sublimifmail.com",
            "name": "asd",
            "password": "$2b$10$X4yJzNEaIlUDmRVsreSIyu3JIjNGFqAtf5SXikyUkhyA7sNAnmVcu",
            "telegram": "@korobok_govna",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-06 14:06:00.855",
            "updatedAt": "2025-09-06 19:22:18.743"
      },
      {
            "id": "cmf979sk60000j72lff8cpeia",
            "email": "dokke.naz@icloud.com",
            "name": "Nazar",
            "password": "$2b$10$pE1zf3pbRjwAeiQLt6P3q.fnWb8pLezUHj3SPcmn2tbXkMeOqdPo.",
            "telegram": "@dark_sidely",
            "role": "ADMIN",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-07 01:35:54.967",
            "updatedAt": "2025-09-12 16:11:35.344"
      },
      {
            "id": "cmf9izdbw0001j72lgoc7vfgo",
            "email": "ggreencatt@gmail.com",
            "name": "Артур Переведенцев",
            "password": "$2b$10$vYutVAaTHfrDEjTpyISpO.3Y4CDy.4DG8J2w38qF36l08vaql5wXy",
            "telegram": "@stxs_ss",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-07 07:03:44.061",
            "updatedAt": "2025-09-07 09:13:29.777"
      },
      {
            "id": "cmf9lgom40002j72l308kh616",
            "email": "iraidaezubsh@inbox.ru",
            "name": "Adlaros",
            "password": "$2b$10$r1UYwEfqaR.hnVKo09pxoOJoHIv2YuJJjlDyjcLGiZFxLW7oXy3gC",
            "telegram": "@hesoyam_traff",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-07 08:13:11.068",
            "updatedAt": "2025-09-07 09:13:29.777"
      },
      {
            "id": "cmf9n2qd00003j72ll9l5hgom",
            "email": "tigoji8936@dpwev.com",
            "name": "Андре Траффик",
            "password": "$2b$10$7m8SFwkWhqiFh/73P6WgwuFcEfLPUgf0TvP9CV.R2ZdUE3WfSxzdO",
            "telegram": "@gargantia_end",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-07 08:58:19.38",
            "updatedAt": "2025-09-07 09:13:29.777"
      },
      {
            "id": "cmf9nczti0004j72l3tv4iif4",
            "email": "jaron.hipolito@freedrops.org",
            "name": "full name",
            "password": "$2b$10$68axjwVo/j5IEE5xpDQHuOSMgbKK.vz16PxvuzxZpUnHziB4hGKy2",
            "telegram": "@web3wom",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-07 09:06:18.198",
            "updatedAt": "2025-09-07 09:13:29.777"
      },
      {
            "id": "cmf9tb87w0005j72lq68ew13z",
            "email": "killianjones902103@gmail.com",
            "name": "Mada Baner",
            "password": "$2b$10$JT00Cad2OGaYNFSvTDgYk.c72S03IgAEoXw6X7u/jJkbMm2hac3IK",
            "telegram": "@madabanner",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-07 11:52:53.468",
            "updatedAt": "2025-09-07 12:55:34.903"
      },
      {
            "id": "cmfa2eg8q0006j72lmzpn59rg",
            "email": "tikofi8436@mirarmax.com",
            "name": "sdgsdfg",
            "password": "$2b$10$mESScEOUIUkZowgr4j4fVujJ1lbvM1u4FrK6wdikDFRsg3rS./mAK",
            "telegram": "@sedgsdg",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-07 16:07:20.378",
            "updatedAt": "2025-09-07 17:15:16.262"
      },
      {
            "id": "cmfa6oj510007j72lavyad223",
            "email": "k31mi.on3@gmail.com",
            "name": "Рори",
            "password": "$2b$10$VoOGT9jqSifuLeGSeiyMie42T5IGKFxx1zxBBjPJ814FSGWRBU352",
            "telegram": "@roryfvckyouboring",
            "role": "PROCESSOR",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-07 18:07:09.158",
            "updatedAt": "2025-09-07 18:18:40.315"
      },
      {
            "id": "cmfa786eg0008j72lu3i3e5n8",
            "email": "biznesmennn000@gmail.com",
            "name": "Иван Иванов",
            "password": "$2b$10$2.wgcc1xQtFzk6MmK5tyx.yrOKikR0EYHn9tq9iEwG3FWyFR9UFuy",
            "telegram": "@timson6",
            "role": "PROCESSOR",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-07 18:22:25.768",
            "updatedAt": "2025-09-07 18:24:12.445"
      },
      {
            "id": "cmfa7aybz0009j72ltmxigmbx",
            "email": "maks.kaaaaas.111@mail.ru",
            "name": "arizona",
            "password": "$2b$10$DcaBBuJIS9aT8yMFspZiv.yfkCHkf1DX2ppG8xlKWi8mBqbriDlfK",
            "telegram": "@blesskzz",
            "role": "PROCESSOR",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-07 18:24:35.28",
            "updatedAt": "2025-09-07 18:25:44.863"
      },
      {
            "id": "cmfa7qys7000aj72lp9pc245y",
            "email": "xapomxapom0@gmail.com",
            "name": "Питер Паркер",
            "password": "$2b$10$lKzijSDghLjavBOU.yX/pObj2X.Qw7hfp5FJW5FM/56X3EanaIBsG",
            "telegram": "@ciel64",
            "role": "PROCESSOR",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-07 18:37:02.36",
            "updatedAt": "2025-09-08 14:05:27.827"
      },
      {
            "id": "cmfarigml000bj72luptwtf04",
            "email": "rkgod@bk.ru",
            "name": "Андрей трафф",
            "password": "$2b$10$yt1fEc.WJn0wJm0Ot/3mfuVvxq2ME9F3gcBuVcJQnLtXxgwJl6vIG",
            "telegram": "@suprerior_tour",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-08 03:50:17.901",
            "updatedAt": "2025-09-08 11:25:43.596"
      },
      {
            "id": "cmfavbmhq000cj72l62feb55w",
            "email": "misha.zloy1@mail.ru",
            "name": "Смирнов Михаил",
            "password": "$2b$10$58/tL3mdFSVZbwFMJ20RvexU6EBSm7xS8mwhPx//7/lTVFPAgBjOe",
            "telegram": "@vor_vorishka",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-08 05:36:57.374",
            "updatedAt": "2025-09-08 11:25:41.206"
      },
      {
            "id": "cmfb63hsc000dj72lel2eu7jl",
            "email": "yungriger@gmail.com",
            "name": "FDSTD",
            "password": "$2b$10$rhUhZXJGOw3rVDTrHiMFK.jGV4vN3Ugm0zN5QX5JWQGP7.BpxK8YS",
            "telegram": "@fuuuust",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-08 10:38:33.804",
            "updatedAt": "2025-09-08 11:25:38.125"
      },
      {
            "id": "cmfc7onl20000pz2ltqaow866",
            "email": "darkpako@tutamail.com",
            "name": "Dark Pako",
            "password": "$2b$10$efQwcGYDWeRK4TH0KhdcwuerV/4zeKy1bnQcXVsfq2QwWq1Py4bkK",
            "telegram": "@star1k_7",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-09 04:10:46.887",
            "updatedAt": "2025-09-09 14:12:12.005"
      },
      {
            "id": "cmfcc1c4e0001pz2ld3h5japk",
            "email": "meadows05207@undimail.com",
            "name": "Кирилл Кирилл",
            "password": "$2b$10$YsMcNbRTUwRFDw1leM4/1.OGwvWpHyyjmU5toSZ2l.7uxZJQZsvIK",
            "telegram": "@itisnotnormal",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-09 06:12:37.022",
            "updatedAt": "2025-09-09 14:12:10.097"
      },
      {
            "id": "cmfcf9prn0002pz2lmqw2ik0k",
            "email": "panav19134@inupup.com",
            "name": "Gena",
            "password": "$2b$10$JcuNmKPUQXHOSM7ZWyy5ZeY97ijcRP9.7ohpVLOomwNdiTcyXoHTy",
            "telegram": "@gena",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-09 07:43:06.803",
            "updatedAt": "2025-09-09 14:12:07.977"
      },
      {
            "id": "cmfche35t0003pz2ly8xriyo4",
            "email": "viv675277@gmail.com",
            "name": "Torch",
            "password": "$2b$10$4jqn3WvpBjemEadw28hpoej5UOb0a3sZBwbhE8Dd5vIHXWXJW.icS",
            "telegram": "@furabetona",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-09 08:42:30.017",
            "updatedAt": "2025-09-09 14:12:05.467"
      },
      {
            "id": "cmfckyllo0004pz2lj6eutxpj",
            "email": "w0139338@gmail.com",
            "name": "Архип Шульженко",
            "password": "$2b$10$qlNG4x0qZ.XJcKmcIuJJYO49fMtvhPsGw6ZC2wwanEc31ftatd1oW",
            "telegram": "@mentalitiesmyblood",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-09 10:22:25.884",
            "updatedAt": "2025-09-09 14:12:02.527"
      },
      {
            "id": "cmfcuto6z0005pz2l5fj0v5jf",
            "email": "rewerter404@gmail.com",
            "name": "Stimer",
            "password": "$2b$10$IveutNuerxWnDdXhTyLHMubLpkrBScOl9E5IUsIT/Y6JAKdk65Or.",
            "telegram": "@hisokir2",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-09 14:58:32.124",
            "updatedAt": "2025-09-09 17:17:14.563"
      },
      {
            "id": "cmfd52j4d0006pz2llrdz33d9",
            "email": "kjsfng@mechanicspedia.com",
            "name": "Semen Zdanovich",
            "password": "$2b$10$NHltIa1djFA9oVTOqLKyvuCk8dxTv/GXd6gYG.l0J4/Jh6TrXQ/hq",
            "telegram": "@https://t.me/irudi666i",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-09 19:45:21.613",
            "updatedAt": "2025-09-10 06:33:48.4"
      },
      {
            "id": "cmfd72ziu0007pz2l36elxdki",
            "email": "olga.panfiloova@gmail.com",
            "name": "Sinrise",
            "password": "$2b$10$FbSvzabDBJzKxIYyPjWL7.a/RodBGpPBi5iqdX92C8Enx0ecelZO.",
            "telegram": "@sunrise3",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-09 20:41:42.103",
            "updatedAt": "2025-09-10 06:33:44.262"
      },
      {
            "id": "cmfdjduqr0008pz2lc8w4zdx5",
            "email": "xiha711@gmail.com",
            "name": "Freddie Simmons",
            "password": "$2b$10$IzfOYnTgTljaI8av91ldRO0qmHVPl0fTPcZ6OGTBwYonk5dBKSE.K",
            "telegram": "@xiha711@gmail.com",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-10 02:26:04.516",
            "updatedAt": "2025-09-10 06:33:41.52"
      },
      {
            "id": "cmfe2lrfn0009pz2laqmooee1",
            "email": "stuilbergjohn@gmail.com",
            "name": "Дикси",
            "password": "$2b$10$HozTMCl5iN45vmgNy8NGtuC0F1yKMOQqEPeImjuKiMBkjw3nYxaF2",
            "telegram": "@itsdiksi",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-10 11:24:06.18",
            "updatedAt": "2025-09-11 10:24:16.527"
      },
      {
            "id": "cmfefwky6000apz2lrkf63qgq",
            "email": "viksvdju@vargosmail.com",
            "name": "rexs",
            "password": "$2b$10$HW1VPyrrvFxeXNk5w3bLWOvXCnIj56KZbKVwX/HMAz.HHdURnoSnq",
            "telegram": "@rexs38",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-10 17:36:25.998",
            "updatedAt": "2025-09-11 10:24:14.178"
      },
      {
            "id": "cmfeg26k6000bpz2ludcv4qw9",
            "email": "wblack.heisenberg@gmail.com",
            "name": "Максим",
            "password": "$2b$10$ctTQwja1QjfN/ZwA3Z.8Y.qe5n40dEeimyLhqwELoCK4nSU/1rOgm",
            "telegram": "@youngtreeze",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-10 17:40:47.286",
            "updatedAt": "2025-09-11 10:24:11.759"
      },
      {
            "id": "cmfgc7d5i000cpz2lshblr0yf",
            "email": "arina.zaitseva007@gmail.com",
            "name": "Николай",
            "password": "$2b$10$RZd3zoJvgK8ZrvR/xN.2zesxCU2k0rhNUJU12ckePgBHgNtl.Hpl2",
            "telegram": "@hdhdh01",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-12 01:28:22.998",
            "updatedAt": "2025-09-12 15:52:21.421"
      },
      {
            "id": "cmfgr3dwc000dpz2lvbrbtvbz",
            "email": "lonelyshafix@gmail.com",
            "name": "Марк Рудовский",
            "password": "$2b$10$vnHyJfFrwp.9rJ/x0YRM1uooh8Pn0aGl76IarNGxEn9x/WXdB7IAO",
            "telegram": "@amgspleef",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-12 08:25:11.58",
            "updatedAt": "2025-09-12 15:52:23.861"
      },
      {
            "id": "cmfh7nyok000epz2lt1kiduc2",
            "email": "workormorg3@proton.me",
            "name": "Zalipex",
            "password": "$2b$10$lVQNOiFnXe1Fc4deUZoBl.vERyGQkRiu..Hy4oyq674xyo..ESlAi",
            "telegram": "@etocortex",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-12 16:09:05.493",
            "updatedAt": "2025-09-12 16:11:41.19"
      },
      {
            "id": "cmfh8ufaq000fpz2lov31ce7j",
            "email": "toigaming123@gmail.com",
            "name": "Marc Jacobs",
            "password": "$2b$10$DT//Aq1b1TiBfO8ciSG8Y.xES1tvAYXLL7rMCU7.D0264WQuBB8FG",
            "telegram": "@horg8888",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-12 16:42:06.578",
            "updatedAt": "2025-09-13 08:34:28.452"
      },
      {
            "id": "cmfi2y2wg000gpz2l0p7dkryc",
            "email": "tramnephima63@gmail.com",
            "name": "Руслан ICANHELP",
            "password": "$2b$10$YknttcHRlZipbdLth4QAI.WEbWXDQGc8ZvrDAEHpLuIfdGH0ojLYi",
            "telegram": "@helpgiving",
            "role": "USER",
            "status": "APPROVED",
            "isBlocked": false,
            "createdAt": "2025-09-13 06:44:45.617",
            "updatedAt": "2025-09-13 08:34:25.661"
      }
];


    // Создаем пользователей батчами по 10
    const batchSize = 10;
    let created = 0;
    
    for (let i = 0; i < allUsers.length; i += batchSize) {
      const batch = allUsers.slice(i, i + batchSize);
      
      for (const user of batch) {
        try {
          await prisma.users.create({
            data: {
              id: user.id,
              email: user.email,
              name: user.name,
              password: user.password,
              telegram: user.telegram,
              role: user.role as any,
              status: user.status as any,
              isBlocked: user.isBlocked,
              createdAt: new Date(user.createdAt),
              updatedAt: new Date(user.updatedAt)
            }
          });
          created++;
          
          if (created % 20 === 0) {
          }
        } catch (error: any) {
          console.warn(`⚠️ Ошибка при создании пользователя ${user.email}:`, error.message);
        }
      }
    }


    return NextResponse.json({ 
      success: true, 
      message: `Успешно мигрировано ${created} из ${allUsers.length} пользователей`,
      created_count: created,
      total_count: allUsers.length
    });

  } catch (error: any) {
    console.error("❌ Ошибка при миграции пользователей:", error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}