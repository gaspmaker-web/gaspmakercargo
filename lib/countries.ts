// lib/countries.ts

// Opcional, pero recomendado: definir el tipo de dato
export interface Country {
    name: string;
    code: string;
    dial_code: string;
}

export const ALL_COUNTRIES: Country[] = [
    { name: "Anguilla", code: "ai", dial_code: "+1-264" },
    { name: "Antigua and Barbuda", code: "ag", dial_code: "+1-268" },
    { name: "Aruba", code: "aw", dial_code: "+297" },
    { name: "Bahamas", code: "bs", dial_code: "+1-242" },
    { name: "Barbados", code: "bb", dial_code: "+1-246" },
    { name: "Bermuda", code: "bm", dial_code: "+1-441" },
    { name: "Bonaire", code: "bq", dial_code: "+599" },
    { name: "British Virgin Islands", code: "vg", dial_code: "+1-284" },
    { name: "Cayman Islands", code: "ky", dial_code: "+1-345" },
    { name: "Cuba", code: "cu", dial_code: "+53" },
    { name: "Curaçao", code: "cw", dial_code: "+599" },
    { name: "Dominica", code: "dm", dial_code: "+1-767" },
    { name: "Dominican Republic", code: "do", dial_code: "+1" }, // +1-809, 829, 849
    { name: "Grenada", code: "gd", dial_code: "+1-473" },
    { name: "Guadeloupe", code: "gp", dial_code: "+590" },
    { name: "Haiti", code: "ht", dial_code: "+509" },
    { name: "Jamaica", code: "jm", dial_code: "+1-876" },
    { name: "Martinique", code: "mq", dial_code: "+596" },
    { name: "Montserrat", code: "ms", dial_code: "+1-664" },
    { name: "Puerto Rico", code: "pr", dial_code: "+1" }, // +1-787, 939
    { name: "Saint Barthélemy", code: "bl", dial_code: "+590" },
    { name: "Saint Kitts and Nevis", code: "kn", dial_code: "+1-869" },
    { name: "Saint Lucia", code: "lc", dial_code: "+1-758" },
    { name: "Saint Martin", code: "mf", dial_code: "+590" },
    { name: "Saint Vincent and the Grenadines", code: "vc", dial_code: "+1-784" },
    { name: "Sint Maarten", code: "sx", dial_code: "+1-721" },
    { name: "Trinidad and Tobago", code: "tt", dial_code: "+1-868" },
    { name: "Turks and Caicos Islands", code: "tc", dial_code: "+1-649" },
    { name: "U.S. Virgin Islands", code: "vi", dial_code: "+1-340" },
    { name: "United States", code: "us", dial_code: "+1" },
    { name: "Mexico", code: "mx", dial_code: "+52" },
    { name: "Colombia", code: "co", dial_code: "+57" },
    { name: "Argentina", code: "ar", dial_code: "+54" },
    { name: "Peru", code: "pe", dial_code: "+51" },
    { name: "Chile", code: "cl", dial_code: "+56" },
    { name: "Venezuela", code: "ve", dial_code: "+58" },
    { name: "Ecuador", code: "ec", dial_code: "+593" },
    { name: "Guatemala", code: "gt", dial_code: "+502" },
    { name: "Bolivia", code: "bo", dial_code: "+591" },
    { name: "Honduras", code: "hn", dial_code: "+504" },
    { name: "Paraguay", code: "py", dial_code: "+595" },
    { name: "El Salvador", code: "sv", dial_code: "+503" },
    { name: "Nicaragua", code: "ni", dial_code: "+505" },
    { name: "Costa Rica", code: "cr", dial_code: "+506" },
    { name: "Panama", code: "pa", dial_code: "+507" },
    { name: "Uruguay", code: "uy", dial_code: "+598" },
    { name: "Spain", code: "es", dial_code: "+34" },
    { name: "Brazil", code: "br", dial_code: "+55" },
    { name: "Canada", code: "ca", dial_code: "+1" },
    { name: "Afghanistan", code: "af", dial_code: "+93" },
    { name: "Albania", code: "al", dial_code: "+355" }, // <-- ¡CORREGIDO!
    { name: "Algeria", code: "dz", dial_code: "+213" },
    { name: "Andorra", code: "ad", dial_code: "+376" },
    { name: "Angola", code: "ao", dial_code: "+244" },
    { name: "France", code: "fr", dial_code: "+33" },
    { name: "Germany", code: "de", dial_code: "+49" },
    { name: "India", code: "in", dial_code: "+91" },
    { name: "Italy", code: "it", dial_code: "+39" },
    { name: "Japan", code: "jp", dial_code: "+81" },
    { name: "Portugal", code: "pt", dial_code: "+351" },
    { name: "United Kingdom", code: "gb", dial_code: "+44" }
];