function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function isContained(x0, y0, x1, y1, d) {
    // console.log(x0+", "+y0+", "+x1+", "+y1);
    return Math.sqrt((x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1)) < (d + 5);
}

function drawPoint(ctx, x, y, r, color) {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, r, 0.0, 2 * Math.PI, false);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function printText(ctx, x, y, width, text, size) {

    var maxWidth = width;
    var lineHeight = 22;
    ctx.save();

    // ctx.font = "20px RobotoRegular";
    ctx.font = size + "px RobotoRegular";
    ctx.fillStyle = "#000";

    text = capitalizeSentence(text);
    var words = text.split(' ');
    var line = '';

    for (var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + ' ';
        var metrics = ctx.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        }
        else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y);

    ctx.restore();
}

function getControlPoints(x0, y0, x1, y1, x2, y2, t) {
    //  x0,y0,x1,y1 are the coordinates of the end (knot) pts of this segment
    //  x2,y2 is the next knot -- not connected here but needed to calculate p2
    //  p1 is the control point calculated here, from x1 back toward x0.
    //  p2 is the next control point, calculated here and returned to become the 
    //  next segment's p1.
    //  t is the 'tension' which controls how far the control points spread.

    //  Scaling factors: distances from this knot to the previous and following knots.
    var d01 = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
    var d12 = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

    var fa = t * d01 / (d01 + d12);
    var fb = t - fa;

    var p1x = x1 + fa * (x0 - x2);
    var p1y = y1 + fa * (y0 - y2);

    var p2x = x1 - fb * (x0 - x2);
    var p2y = y1 - fb * (y0 - y2);

    // return [p1x, p1y, p2x, p2y];

    return [x1 + fa * (x0 - x2), y1, x1 - fa * (x0 - x2), y1];
}

function drawSpline2(ctx, pts, ptsR, t, flowColor, strongColor) {

    ctx.save();

    ctx.lineWidth = 1;
    ctx.strokeStyle = pSBC(-0.4, flowColor, false, true);

    ctx.fillStyle = flowColor;
    ctx.globalAlpha = 0.8;

    if (strongColor) {
        ctx.globalAlpha = 0.9;
        ctx.globalCompositeOperation = "source-over";
    } else {
        ctx.globalAlpha = 0.8;
        ctx.globalCompositeOperation = "destination-over";
    }


    var cp = [];   // array of control points, as x0,y0,x1,y1,...
    var n = pts.length;
    var cpR = [];   // array of control points, as x0,y0,x1,y1,...
    var nR = ptsR.length;

    if (n < 5) {
        ctx.beginPath();
        ctx.moveTo(pts[0], pts[1]);
        ctx.quadraticCurveTo(pts[0] + (pts[2] - pts[0]) / 2, pts[1] + 0.2 * (pts[3] - pts[1]) / 2, pts[2], pts[3]);
        ctx.quadraticCurveTo(pts[2], pts[3], ptsR[2], ptsR[3]);
        ctx.quadraticCurveTo(ptsR[0] + (ptsR[2] - ptsR[0]) / 2, ptsR[1] + 0.2 * (ptsR[3] - ptsR[1]) / 2, ptsR[0], ptsR[1]);
        ctx.fill();

        ctx.closePath();

    } else {

        for (var i = 0; i < n - 5; i += 2) {
            cp = cp.concat(getControlPoints(pts[i], pts[i + 1], pts[i + 2], pts[i + 3], pts[i + 4], pts[i + 5], t));
        }

        for (var i = 0; i < nR - 5; i += 2) {
            cpR = cpR.concat(getControlPoints(ptsR[i], ptsR[i + 1], ptsR[i + 2], ptsR[i + 3], ptsR[i + 4], ptsR[i + 5], t));
        }

        ctx.beginPath();
        ctx.moveTo(pts[0], pts[1]);
        ctx.quadraticCurveTo(cp[0], cp[1], pts[2], pts[3]);
        ctx.quadraticCurveTo(pts[2], pts[3], ptsR[2], ptsR[3]);
        ctx.quadraticCurveTo(cpR[0], cpR[1], ptsR[0], ptsR[1]);
        ctx.fill();
        ctx.closePath();


        for (var i = 2; i < n - 4; i += 2) {
            ctx.beginPath();
            ctx.moveTo(pts[i], pts[i + 1]);
            ctx.bezierCurveTo(cp[2 * i - 2], cp[2 * i - 1], cp[2 * i], cp[2 * i + 1], pts[i + 2], pts[i + 3]);
            ctx.quadraticCurveTo(pts[i + 2], pts[i + 3], ptsR[i + 2], ptsR[i + 3]);
            ctx.bezierCurveTo(cpR[2 * i], cpR[2 * i + 1], cpR[2 * i - 2], cpR[2 * i - 1], ptsR[i], ptsR[i + 1]);
            ctx.fill();
            ctx.closePath();
        }


        ctx.beginPath();
        ctx.moveTo(pts[n - 4], pts[n - 3]);
        ctx.quadraticCurveTo(cp[2 * n - 10], cp[2 * n - 9], pts[n - 2], pts[n - 1]);
        ctx.quadraticCurveTo(pts[n - 2], pts[n - 1], ptsR[n - 2], ptsR[n - 1]);
        ctx.quadraticCurveTo(cpR[2 * n - 10], cpR[2 * n - 9], ptsR[n - 4], ptsR[n - 3]);
        ctx.fill();
        ctx.closePath();
    }

    ctx.restore();


}

function drawSpline3(ctx, pts, ptsR, t, flowColor, drawEdge, strongColor) {

    var strokeColor = pSBC(-0.3, flowColor, false, true);

    ctx.save();

    ctx.lineWidth = 2;
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = flowColor;
    if (strongColor) {
        ctx.globalAlpha = 0.9;
        ctx.globalCompositeOperation = "source-over";
    } else {
        ctx.globalAlpha = 0.8;
        ctx.globalCompositeOperation = "destination-over";
    }

    var cp = [];   // array of control points, as x0,y0,x1,y1,...
    var n = pts.length;
    var cpR = [];   // array of control points, as x0,y0,x1,y1,...
    var nR = ptsR.length;
    var lines = [];

    if (n < 7) {
        ctx.beginPath();
        ctx.moveTo(pts[0], pts[1]);
        ctx.quadraticCurveTo(pts[0] + (pts[3] - pts[0]) / 2, pts[1] + 0.2 * (pts[4] - pts[1]) / 2, pts[3], pts[4]);
        ctx.quadraticCurveTo(pts[3], pts[4], ptsR[3], ptsR[4]);
        ctx.quadraticCurveTo(ptsR[0] + (ptsR[3] - ptsR[0]) / 2, ptsR[4] + 0.2 * (ptsR[4] - ptsR[1]) / 2, ptsR[0], ptsR[1]);
        ctx.fill();

        ctx.closePath();

    } else {

        for (var i = 0; i < n - 8; i += 3) {
            cp = cp.concat(getControlPoints(pts[i], pts[i + 1], pts[i + 3], pts[i + 4], pts[i + 6], pts[i + 7], t));
        }

        for (var i = 0; i < nR - 8; i += 3) {
            cpR = cpR.concat(getControlPoints(ptsR[i], ptsR[i + 1], ptsR[i + 3], ptsR[i + 4], ptsR[i + 6], ptsR[i + 7], t));
        }

        var currentGlobalCompositeOperation = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = "destination-over";

        ctx.beginPath();
        ctx.moveTo(pts[0], pts[1]);
        ctx.quadraticCurveTo(cp[0], cp[1], pts[3], pts[4]);
        ctx.quadraticCurveTo(pts[3], pts[4], ptsR[3], ptsR[4]);
        ctx.quadraticCurveTo(cpR[0], cpR[1], ptsR[0], ptsR[1]);
        ctx.fill();
        ctx.closePath();

        var size = n / 3;
        for (var i = 1; i < size - 2; i++) {
            if (i > 2) {
                ctx.globalCompositeOperation = currentGlobalCompositeOperation;
            }
            ctx.beginPath();
            ctx.moveTo(pts[i * 3], pts[i * 3 + 1]);

            ctx.bezierCurveTo(cp[i * 4 - 2], cp[i * 4 - 1], cp[i * 4], cp[i * 4 + 1], pts[i * 3 + 3], pts[i * 3 + 4]);

            if (drawEdge) {
                lines.push([pts[i * 3], pts[i * 3 + 1], cp[i * 4 - 2], cp[i * 4 - 1], cp[i * 4], cp[i * 4 + 1], pts[i * 3 + 3], pts[i * 3 + 4], pts[i * 3 + 5]]);
            }

            ctx.quadraticCurveTo(pts[i * 3 + 3], pts[i * 3 + 4], ptsR[i * 3 + 3], ptsR[i * 3 + 4]);
            ctx.bezierCurveTo(cpR[i * 4], cpR[i * 4 + 1], cpR[i * 4 - 2], cpR[i * 4 - 1], ptsR[i * 3], ptsR[i * 3 + 1]);
            ctx.fill();

            ctx.closePath();

        }

        ctx.beginPath();
        ctx.moveTo(pts[n - 6], pts[n - 5]);

        ctx.quadraticCurveTo(cp[cp.length - 2], cp[cp.length - 1], pts[n - 3], pts[n - 2]);
        lines.push([pts[n - 6], pts[n - 5], cp[cp.length - 2], cp[cp.length - 1], pts[n - 3], pts[n - 2], pts[n - 1]]);

        ctx.quadraticCurveTo(pts[n - 3], pts[n - 2], ptsR[n - 3], ptsR[n - 2]);
        ctx.quadraticCurveTo(cpR[cp.length - 2], cpR[cp.length - 1], ptsR[n - 6], ptsR[n - 5]);
        ctx.fill();

        ctx.closePath();
    }

    ctx.restore();

    for (var i = 0; i < lines.length; i++) {

        if (i > 0) {
            drawLine(ctx, lines[i], 0, 0.5, strokeColor, lines[i - 1][8]);
        }
        drawLine(ctx, lines[i], 0.5, 1, strokeColor, lines[i][8]);
    }

}

function drawLine(ctx, pts, start, end, strokeColor, density) {

    if (density > 0) {

        var step = 0.01;
        var increment = (end - start) / step; //50

        if (density > 50) {
            increment = 2;
        } else if (density > 20) {
            increment = 5;
        }

        var lines = [];

        for (var t = start; t <= end; t += step) {

            if (pts.length == 9) {
                var x = (1 - t) * (1 - t) * (1 - t) * pts[0] + 3 * (1 - t) * (1 - t) * t * pts[2] + 3 * (1 - t) * t * t * pts[4] + t * t * t * pts[6];
                var y = (1 - t) * (1 - t) * (1 - t) * pts[1] + 3 * (1 - t) * (1 - t) * t * pts[3] + 3 * (1 - t) * t * t * pts[5] + t * t * t * pts[7];

                lines.push([x, y]);
            }

            if (pts.length == 7) {

                x = (1 - t) * (1 - t) * pts[0] + 2 * (1 - t) * t * pts[2] + t * t * pts[4];
                y = (1 - t) * (1 - t) * pts[1] + 2 * (1 - t) * t * pts[3] + t * t * pts[5];

                lines.push([x, y]);
            }
        }

        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;

        for (var i = 1; i < lines.length; i++) {

            if (i % increment != 0) {
                ctx.beginPath();
                ctx.moveTo(lines[i - 1][0], lines[i - 1][1]);
                ctx.lineTo(lines[i][0], lines[i][1]);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

}


const pSBC = (p, c0, c1, l) => {
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

function capitalizeSentence(s) {
    var words = s.split(" ");
    var updated = "";
    for (var w of words) {
        updated += " " + capitalizeWord(w);
    }
    return updated.substring(1);
}

function capitalizeWord(s) {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
}