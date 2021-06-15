const educationOrder = ["professor", "postdoc", "phd", "grad", "undergrad", "unknown"];

const educationColor = ["#A55D8E", "#2CA6D6", "#FFB04F", "#3EBCAA", "#F05750", "#dfff00"];
// const educationColor = ["#A55D8E", "#F05750", "#2CA6D6", "#3EBCAA", "#FFB04F", "#A6E053"];

const genderColor = { "male": "#41bbc5", "female": "#772d48", "unknown": "#727c7e" };
// const genderColor = { "male": "#873e23", "female": "#e28743", "unknown": "#727c7e" };
// const englishColor = { "native": "#9e9ac8", "non-native": "#df65b0" };
const englishColor = { "native": "#7a0177", "non-native": "#225ea8" };

const inactiveColor = ["#C0C0C0", "#808080", "#606060"];

const maxLight = 0.6;

function assignColors(speakers, colorTheme) {

    var speakerArray = Object.entries(speakers);

    var colorAssignment = {};
    var colorSorting = {};

    //only deal with education for now
    // colorTheme = "education"; 

    if (colorTheme == "education") {

        for (var s of speakerArray) {
            // console.log(s);

            if (colorSorting[s[1].education]) {
                colorSorting[s[1].education].push(s[1]);
            } else {
                colorSorting[s[1].education] = [s[1]];
            }

        }

        for (var c of Object.keys(colorSorting)) {

            if (colorSorting[c].length == 1) {
                colorAssignment[colorSorting[c][0].name] = educationColor[educationOrder.indexOf(c.toLowerCase())];
            }

            if (colorSorting[c].length > 1) {
                var speakerList = colorSorting[c];

                speakerList.sort(function (a, b) {
                    if (a.age && b.age) {
                        return b.age - a.age;
                    } else if (a.age) {
                        return -1;
                    } else {
                        return 1;
                    }

                });


                var baseColor = educationColor[educationOrder.indexOf(c.toLowerCase())];
                var step = maxLight / (speakerList.length - 1);

                for (var i = 0; i < speakerList.length; i++) {
                    colorAssignment[speakerList[i].name] = editColor(i * step, baseColor, false, true);
                }
            }

        }

        // for (var s of Object.entries(colorAssignment)) {
        //     console.log(s[0] + "(" + speakers[s[0]].education + " - " + speakers[s[0]].age + "): " + colorAssignment[s[0]]);
        // }


        
    }

    if (colorTheme == "english") {

        for (var s of speakerArray) {
            // console.log(s);

            if (colorSorting[s[1].english]) {
                colorSorting[s[1].english].push(s[1]);
            } else {
                colorSorting[s[1].english] = [s[1]];
            }

        }

        for (var c of Object.keys(colorSorting)) {

            if (colorSorting[c].length == 1) {
                colorAssignment[colorSorting[c][0].name] = englishColor[colorSorting[c][0].english];
            }

            if (colorSorting[c].length > 1) {
                var speakerList = colorSorting[c];

                speakerList.sort(function (a, b) {
                    if (a.age && b.age) {
                        return b.age - a.age;
                    } else if (a.age) {
                        return -1;
                    } else {
                        return 1;
                    }

                });


                var baseColor = englishColor[colorSorting[c][0].english];
                var step = maxLight / (speakerList.length - 1);

                for (var i = 0; i < speakerList.length; i++) {
                    colorAssignment[speakerList[i].name] = editColor(i * step, baseColor, false, true);
                }
            }

        }
        
    }

    if (colorTheme == "gender") {

        for (var s of speakerArray) {
            // console.log(s);

            if (colorSorting[s[1].gender]) {
                colorSorting[s[1].gender].push(s[1]);
            } else {
                colorSorting[s[1].gender] = [s[1]];
            }

        }

        for (var c of Object.keys(colorSorting)) {

            if (colorSorting[c].length == 1) {
                colorAssignment[colorSorting[c][0].name] = genderColor[colorSorting[c][0].gender.toLowerCase()];
            }

            if (colorSorting[c].length > 1) {
                var speakerList = colorSorting[c];

                speakerList.sort(function (a, b) {
                    if (a.age && b.age) {
                        return b.age - a.age;
                    } else if (a.age) {
                        return -1;
                    } else {
                        return 1;
                    }

                });


                var baseColor = genderColor[colorSorting[c][0].gender.toLowerCase()];
                var step = maxLight / (speakerList.length - 1);

                for (var i = 0; i < speakerList.length; i++) {
                    colorAssignment[speakerList[i].name] = editColor(i * step, baseColor, false, true);
                }
            }

        }
        
    }

    return colorAssignment;
}


//https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
function editColor(p, c0, c1, l) {
    let r, g, b, P, f, t, h, i = parseInt, m = Math.round, a = typeof (c1) == "string";
    if (typeof (p) != "number" || p < -1 || p > 1 || typeof (c0) != "string" || (c0[0] != 'r' && c0[0] != '#') || (c1 && !a)) return null;
    if (!this.pSBCr) this.pSBCr = (d) => {
        let n = d.length, x = {};
        if (n > 9) {
            [r, g, b, a] = d = d.split(","), n = d.length;
            if (n < 3 || n > 4) return null;
            x.r = i(r[3] == "a" ? r.slice(5) : r.slice(4)), x.g = i(g), x.b = i(b), x.a = a ? parseFloat(a) : -1
        } else {
            if (n == 8 || n == 6 || n < 4) return null;
            if (n < 6) d = "#" + d[1] + d[1] + d[2] + d[2] + d[3] + d[3] + (n > 4 ? d[4] + d[4] : "");
            d = i(d.slice(1), 16);
            if (n == 9 || n == 5) x.r = d >> 24 & 255, x.g = d >> 16 & 255, x.b = d >> 8 & 255, x.a = m((d & 255) / 0.255) / 1000;
            else x.r = d >> 16, x.g = d >> 8 & 255, x.b = d & 255, x.a = -1
        } return x
    };
    h = c0.length > 9, h = a ? c1.length > 9 ? true : c1 == "c" ? !h : false : h, f = this.pSBCr(c0), P = p < 0, t = c1 && c1 != "c" ? this.pSBCr(c1) : P ? { r: 0, g: 0, b: 0, a: -1 } : { r: 255, g: 255, b: 255, a: -1 }, p = P ? p * -1 : p, P = 1 - p;
    if (!f || !t) return null;
    if (l) r = m(P * f.r + p * t.r), g = m(P * f.g + p * t.g), b = m(P * f.b + p * t.b);
    else r = m((P * f.r ** 2 + p * t.r ** 2) ** 0.5), g = m((P * f.g ** 2 + p * t.g ** 2) ** 0.5), b = m((P * f.b ** 2 + p * t.b ** 2) ** 0.5);
    a = f.a, t = t.a, f = a >= 0 || t >= 0, a = f ? a < 0 ? t : t < 0 ? a : a * P + t * p : 0;
    if (h) return "rgb" + (f ? "a(" : "(") + r + "," + g + "," + b + (f ? "," + m(a * 1000) / 1000 : "") + ")";
    else return "#" + (4294967296 + r * 16777216 + g * 65536 + b * 256 + (f ? m(a * 255) : 0)).toString(16).slice(1, f ? undefined : -2)
}