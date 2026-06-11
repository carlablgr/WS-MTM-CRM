import { prisma } from "../src/lib/prisma";

const SHOP = "Covent Garden Ladieswear";
const CONDUCTED_BY = "Carla";

interface ItemInput {
  garmentName: string;
  blockSize?: string;
  cloth?: string;
  lining?: string;
  internal?: string;
  accents?: string;
  buttons?: string;
  totalIncVat?: number;
  notes?: string;
}

interface OrderInput {
  date: string;
  depositPaid: number;
  fullyPaid?: boolean;
  status: "DEPOSIT_TAKEN" | "SUBMITTED_TO_FACTORY" | "IN_PRODUCTION" | "ARRIVED" | "COLLECTED";
  notes?: string;
  items: ItemInput[];
}

interface CustomerInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  orders: OrderInput[];
}

// Cost = amount paid as deposit; Balance = amount outstanding.
// itemTotal = Cost + Balance. Order depositPaid = sum of item Costs.
const customers: CustomerInput[] = [
  {
    firstName: "Windy",
    lastName: "Marty",
    email: "windy.marty@gmail.com",
    orders: [
      {
        date: "2024-10-28",
        depositPaid: 150,
        status: "ARRIVED",
        items: [
          {
            garmentName: "Jura Trs",
            cloth: "CW HB Blue",
            blockSize: "6",
            totalIncVat: 217.5,
            notes: 'Add 2" seam allowance through seat',
          },
        ],
      },
    ],
  },
  {
    firstName: "Marine",
    lastName: "Roberton",
    email: "marine.roberton@gmail.com",
    orders: [
      {
        date: "2024-11-11",
        depositPaid: 393.75 + 93.5,
        status: "ARRIVED",
        items: [
          {
            garmentName: "Arran Jacket Long",
            cloth: "HT PL Black",
            blockSize: "8",
            totalIncVat: 393.75 + 487.25,
            notes:
              'Lengthen by 15 inches. CF Length 37" / CB Length 39". Add two extra buttons in front below existing ones at same distance',
          },
          {
            garmentName: "Iona Wc",
            cloth: "BT MC Brown",
            blockSize: "10",
            totalIncVat: 93.5,
          },
        ],
      },
    ],
  },
  {
    firstName: "Brigit",
    lastName: "Obermeier",
    email: "b.obermeier@web.de",
    orders: [
      {
        date: "2024-11-22",
        depositPaid: 101.25,
        status: "ARRIVED",
        items: [
          {
            garmentName: "Sheila Skirt",
            cloth: "BT MC Brown",
            blockSize: "14",
            totalIncVat: 202.5,
          },
        ],
      },
    ],
  },
  {
    firstName: "Franca",
    lastName: "Roberts",
    email: "francabongiorno@hotmail.com",
    orders: [
      {
        date: "2025-02-25",
        depositPaid: 300 + 300,
        status: "ARRIVED",
        items: [
          {
            garmentName: "Ronay Jkt",
            cloth: "Holland & Sherry HS 2460 – 6024056",
            blockSize: "8",
            totalIncVat: 300 + 226,
            notes: "External fabric — see cloth code",
          },
          {
            garmentName: "Charli Trs",
            blockSize: "6",
            totalIncVat: 300 + 46,
            notes: 'Add 1.5" seam allowance to trouser waistband and seat',
          },
        ],
      },
    ],
  },
  {
    firstName: "Lydia",
    lastName: "Coulter",
    email: "lydiajonson@icloud.com",
    phone: "07951157038",
    orders: [
      {
        date: "2025-04-16",
        depositPaid: 132,
        status: "SUBMITTED_TO_FACTORY",
        items: [
          {
            garmentName: "Julianne Wc",
            cloth: "CW HB Blue",
            blockSize: "14",
            totalIncVat: 132 + 132,
            notes: "Lengthen by 1 inch",
          },
        ],
      },
    ],
  },
  {
    firstName: "Gaelen",
    lastName: "Perrone",
    email: "gaelen.perrone@gmail.com",
    orders: [
      {
        date: "2025-05-03",
        depositPaid: 276,
        status: "ARRIVED",
        items: [
          {
            garmentName: "Hepburn Jacket",
            cloth: "CW HB Navy",
            blockSize: "14",
            totalIncVat: 276 + 276,
            notes: "Add slanted pockets instead",
          },
        ],
      },
    ],
  },
  {
    firstName: "Victoria",
    lastName: "Boulanger",
    email: "victoriaalexis.b@gmail.com",
    orders: [
      {
        date: "2025-06-02",
        depositPaid: 148,
        status: "SUBMITTED_TO_FACTORY",
        items: [
          {
            garmentName: "Dionne Shorts",
            cloth: "LW TW DN Oatmeal",
            blockSize: "10",
            totalIncVat: 148 + 148,
          },
        ],
      },
    ],
  },
  {
    firstName: "Eva",
    lastName: "Gomez",
    email: "everandeva@yahoo.com",
    orders: [
      {
        date: "2025-10-15",
        depositPaid: 264 + 232,
        status: "ARRIVED",
        items: [
          {
            garmentName: "Julianne Wc",
            cloth: "HT BC Rust",
            blockSize: "8",
            totalIncVat: 264 + 132,
            notes:
              "Lower neckline to second button, make length 1 inch longer, back lining in burgundy. (Status: Arrived)",
          },
          {
            garmentName: "Westray Trs",
            blockSize: "10",
            totalIncVat: 232 + 116,
            notes: "Make lining same as Charli Trs. (Status: Awaiting ETA)",
          },
        ],
      },
    ],
  },
  {
    firstName: "Kasia",
    lastName: "Mckay",
    email: "mckaykasia@gmail.com",
    orders: [
      {
        date: "2025-10-15",
        depositPaid: 232,
        status: "ARRIVED",
        items: [
          {
            garmentName: "Westray Trs",
            cloth: "CW HB Navy",
            blockSize: "12",
            totalIncVat: 232 + 116,
            notes: 'Add 1" to waist circumference, leave 2" seam allowance through waist',
          },
        ],
      },
    ],
  },
  {
    // Sonya Laxo — appears in customer entries 10, 16, 21. All three orders
    // are linked to this single customer record.
    firstName: "Sonya",
    lastName: "Laxo",
    email: "sonylaxo@gmail.com",
    orders: [
      {
        date: "2025-10-27",
        depositPaid: 232 + 258,
        status: "ARRIVED",
        items: [
          {
            garmentName: "Westray Trs",
            cloth: "HT HB Green",
            blockSize: "12",
            totalIncVat: 232 + 116,
          },
          {
            garmentName: "Victoria Skirt",
            blockSize: "14",
            totalIncVat: 258 + 129,
          },
        ],
      },
      {
        date: "2025-12-16",
        depositPaid: 410,
        status: "ARRIVED",
        items: [
          {
            garmentName: "Emma Jkt",
            cloth: "LW FHB Purple",
            blockSize: "16",
            totalIncVat: 410 + 205,
            notes: 'Lengthen body by 2" and sleeves by 2"',
          },
        ],
      },
      {
        date: "2025-03-09",
        depositPaid: 232 + 200,
        status: "IN_PRODUCTION",
        items: [
          {
            garmentName: "Iona Wc",
            blockSize: "16",
            totalIncVat: 232 + 116,
            notes: "(Status: Awaiting arrival)",
          },
          {
            garmentName: "Westray Trs",
            cloth: "LW FHB Purple",
            blockSize: "12",
            totalIncVat: 200 + 100,
            notes: "Fully lined. (Status: Arrived)",
          },
        ],
      },
      {
        date: "2026-06-08",
        depositPaid: 200,
        fullyPaid: true,
        status: "IN_PRODUCTION",
        notes:
          "Notes on collection: let her know when ready, ask if she wants it shipped with rest of items or will pick up.",
        items: [
          {
            garmentName: "Iona Wc",
            cloth: "HT HB Green",
            blockSize: "16",
            totalIncVat: 200,
            notes: "Paid in full. Lengthen body by 2cm.",
          },
        ],
      },
    ],
  },
  {
    firstName: "Helen",
    lastName: "Chapman",
    email: "hlc.hlc@yahoo.com",
    orders: [
      {
        date: "2025-11-09",
        depositPaid: 360,
        status: "IN_PRODUCTION",
        notes: "Delayed.",
        items: [
          {
            garmentName: "Jura Kilt",
            cloth: "HT HB Green",
            blockSize: "10",
            totalIncVat: 342,
            notes: "Delayed — order in credit by £18 (deposit of £360 paid against £342 total).",
          },
        ],
      },
    ],
  },
  {
    firstName: "Josephine",
    lastName: "Simmons",
    phone: "1797690587",
    orders: [
      {
        date: "2025-12-09",
        depositPaid: 264,
        fullyPaid: true,
        status: "ARRIVED",
        items: [
          {
            garmentName: "Cara Trs",
            cloth: "HT HB Azure",
            blockSize: "12",
            totalIncVat: 264,
            notes: "Everything as per production. Arrived 28/01.",
          },
        ],
      },
      // Order from "Jo Simmons" entry — same phone number, merged into this customer.
      {
        date: "2026-04-20",
        depositPaid: 264 + 552,
        status: "DEPOSIT_TAKEN",
        items: [
          {
            garmentName: "Cara Trs",
            cloth: "HT PL Rust",
            blockSize: "12",
            totalIncVat: 264 + 815,
            notes:
              "Everything as per production. (Stated total of £408 did not reconcile with cost/balance figures provided — recorded total reflects cost + balance.)",
          },
          {
            garmentName: "Iona Jkt",
            blockSize: "10",
            totalIncVat: 552,
          },
        ],
      },
    ],
  },
  {
    firstName: "Juliana",
    lastName: "K de Souza Cruz",
    orders: [
      {
        date: "2025-01-03",
        depositPaid: 670.25,
        status: "ARRIVED",
        items: [
          {
            garmentName: "Iona Jacket",
            cloth: "Holland & Sherry HS 2466 – 662015 (5 metres ordered)",
            blockSize: "10",
            totalIncVat: 670.25 + 670.25,
            notes:
              'Turn lapels into peak lapels, increase armhole by 1", increase sleeve width by 1", working breast pocket, inside pocket 4" deep. Arrived, awaiting appointment.',
          },
          {
            garmentName: "Julianne Wc",
            blockSize: "10",
            notes: "Lower neckline to second button, add lapels as Iona Wc.",
          },
          {
            garmentName: "Jura Trs",
            blockSize: "8",
            notes:
              'Increase front rise by 0.5", increase thigh width by 1.5", leave seam allowance through leg, unfinished hem.',
          },
        ],
      },
    ],
  },
  {
    firstName: "Sharon",
    lastName: "Kean",
    orders: [
      {
        date: "2026-01-31",
        depositPaid: 264 + 311.2,
        status: "ARRIVED",
        items: [
          {
            garmentName: "Julianne Wc",
            cloth: "WF PL Mid Grey",
            blockSize: "8",
            totalIncVat: 264 + 132,
            notes: "Make back lining and add welt pockets",
          },
          {
            garmentName: "Jura Trs",
            cloth: "Holland & Sherry 6024003",
            blockSize: "6",
            totalIncVat: 311.2 + 155.6 + 287.6,
            notes:
              'Lower front and back rise by 1.5", increase waist by 2", make front pleats 1" deep, increase side pockets depth by 2", add side adjusters. Additional costs of £287.60 (external fabric) added to balance.',
          },
        ],
      },
    ],
  },
  {
    firstName: "Alla",
    lastName: "Logova",
    orders: [
      {
        date: "2026-02-19",
        depositPaid: 444,
        fullyPaid: true,
        status: "COLLECTED",
        items: [
          {
            garmentName: "Harper Trs",
            cloth: "HT HB Fawn",
            blockSize: "14",
            totalIncVat: 444,
            notes:
              "Lining and details as per production. Originally £148 balance outstanding — paid in full and picked up 04/06.",
          },
        ],
      },
    ],
  },
  {
    firstName: "Erin",
    lastName: "Deblois Read",
    email: "erindread@gmail.com",
    orders: [
      {
        date: "2026-03-30",
        depositPaid: 1064,
        fullyPaid: true,
        status: "ARRIVED",
        items: [
          {
            garmentName: "Emma Jkt",
            cloth: "CW HB Grey",
            blockSize: "12",
            totalIncVat: 520,
            notes: "Change waistband to Charli Trs waistband. Arrived 04/06.",
          },
          {
            garmentName: "Julianne Wc",
            blockSize: "10",
            totalIncVat: 264,
            notes: "Arrived 04/06.",
          },
          {
            garmentName: "Harper Trs",
            blockSize: "10",
            totalIncVat: 280,
            notes: "(Status: Confirmed — not yet arrived)",
          },
        ],
      },
    ],
  },
  {
    firstName: "Kirsty",
    lastName: "Lucas",
    email: "lucas.kirsty@btinternet.com",
    phone: "07717742266",
    orders: [
      {
        date: "2026-04-20",
        depositPaid: 552 + 200 + 392,
        status: "DEPOSIT_TAKEN",
        items: [
          {
            garmentName: "Iona Jkt",
            cloth: "HT HB Purple",
            blockSize: "22",
            totalIncVat: 552,
            notes:
              "Let out waist by 1.5 inches, make 2 buttoned — move front closure button up by 2.5 inches and add second button 5 inches below.",
          },
          {
            garmentName: "Iona Wc",
            blockSize: "26",
            totalIncVat: 200 + 572,
            notes: "Arrived 04/06 — paid, alterations in October.",
          },
          {
            garmentName: "Deborah Skirt",
            blockSize: "22",
            totalIncVat: 392,
            notes:
              'Make waistband width 1.5 inches, lengthen skirt by 13 inches. (Status: Not yet submitted)',
          },
        ],
      },
    ],
  },
  {
    firstName: "Nancie",
    lastName: "Pattrick",
    orders: [
      {
        date: "2026-05-28",
        depositPaid: 264 + 264,
        status: "DEPOSIT_TAKEN",
        items: [
          {
            garmentName: "Charlotte Pant",
            cloth: "HT SRU Navy",
            totalIncVat: 528,
            notes: "Purple lining as Iona Wc HT HB Purple",
          },
          {
            garmentName: "Garment (TBC)",
            cloth: "Brown checked fabric TBC",
            blockSize: "4",
            totalIncVat: 264,
            notes: "Burgundy lining. (Status: To be confirmed)",
          },
        ],
      },
    ],
  },
];

async function findOrCreateCustomer(c: CustomerInput): Promise<string> {
  let existing = null;
  if (c.email) {
    existing = await prisma.customer.findFirst({ where: { email: c.email } });
  }
  if (!existing && c.phone) {
    existing = await prisma.customer.findFirst({ where: { phone: c.phone } });
  }
  if (existing) return existing.id;

  const created = await prisma.customer.create({
    data: {
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
    },
  });
  return created.id;
}

async function main() {
  for (const c of customers) {
    const customerId = await findOrCreateCustomer(c);
    console.log(`Customer: ${c.firstName} ${c.lastName} -> ${customerId}`);

    for (const order of c.orders) {
      const grandTotal = order.items.reduce((s, it) => s + (it.totalIncVat ?? 0), 0);
      const fullyPaid = order.fullyPaid ?? (order.depositPaid >= grandTotal && grandTotal > 0);

      const created = await prisma.mtoOrder.create({
        data: {
          customerId,
          date: new Date(order.date),
          conductedBy: CONDUCTED_BY,
          shop: SHOP,
          status: order.status,
          depositPaid: order.depositPaid,
          fullyPaid,
          notes: order.notes,
          items: {
            create: order.items.map((item, i) => ({
              sortOrder: i,
              garmentName: item.garmentName,
              blockSize: item.blockSize ?? null,
              cloth: item.cloth ?? null,
              lining: item.lining ?? null,
              internal: item.internal ?? null,
              accents: item.accents ?? null,
              buttons: item.buttons ?? null,
              totalIncVat: item.totalIncVat ?? null,
              notes: item.notes ?? null,
            })),
          },
        },
      });
      console.log(`  Order ${created.id} (${order.date}) — ${order.items.length} item(s)`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
