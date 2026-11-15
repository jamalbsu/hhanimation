r"""
Running panther: a black panther gallops across a sunset savanna, slows to a stop, turns to
look at the camera, then lies down happily.
Everything is drawn from shapes and math in this file; nothing is loaded from disk.

Render from the manim-test folder:
  .\.venv\Scripts\python.exe -m manim -qh run_panther.py PantherRun       final 1080p60
  .\.venv\Scripts\python.exe -m manim -qm --fps 60 run_panther.py PantherRun   720p60 preview
  .\.venv\Scripts\python.exe -m manim -ql -s run_panther.py RunCycle      still of 8 poses of one stride
  .\.venv\Scripts\python.exe -m manim -ql -s run_panther.py StoryPoses    still of 8 moments of the story
  (low frame rates such as -ql's 15 fps make any run look choppy; judge smoothness at 60 fps)

How it works
  * The whole picture is a function of time t. Each frame, the panther and the moving
    scenery are rebuilt from scratch for that t (always_redraw).
  * pose_at(t) turns the story timeline into a handful of dials: how hard it gallops, how far
    it has lain down, how far its head has turned, ears, blink, smile, happiness. The drawing
    code blends between a gallop, a standing pose and a lying pose using those dials, so
    every change is a smooth glide rather than a cut.
  * The legs follow a rotary gallop: both hinds land, the body stretches out in the air,
    both fronts land, the body bunches up in the air, repeat. Paws leave and meet the ground
    at ground speed and joints never snap straight (soft inverse kinematics).
  * The head is drawn from points on a 3D head that is projected to the screen, so turning it
    toward the camera moves the eyes, nose, mouth, ears and whiskers into a 3/4 face.
  * The ground scrolls at the panther's running speed, so planted paws never slide.
"""

from manim import *
import numpy as np

# ------------------------------------------------------------------ story timing (seconds)
START_X = -10.5                 # the panther starts off-screen left
ARRIVE_X = -0.5                 # where it sits on screen once the camera follows it
EASE = 1.0                      # seconds the camera takes to catch up
STOP_AT, STOP_LEN = 5.0, 1.8    # brakes from a full gallop to standing
LOOK_AT, LOOK_LEN = 7.0, 0.8    # turns its head to the camera
BLINK_AT, BLINK_LEN = 8.1, 0.5  # a slow, friendly cat blink
LIE_AT = 8.8                    # lies down: front end first, then the hips
HAPPY_AT = 11.1                 # happy closed eyes, smile, hearts
ZOOM_AT, ZOOM_LEN = 6.0, 3.0    # the camera gently pushes in
ZOOM_WIDTH, ZOOM_CENTRE = 8.6, (-0.9, -0.8)
DURATION = 14.5

# ------------------------------------------------------------------ gallop
FREQ = 1.45                     # strides per second at full gallop
DUTY = 0.28                     # share of a stride each paw spends on the ground
STRIDE = 1.2                    # how far a planted paw travels back during one stance
FOLLOW = 1.0                    # how much a paw keeps moving back after lift-off (1 = matches ground speed)
SPEED = STRIDE * FREQ / DUTY    # full running speed in scene units per second
GROUND_Y = -2.0                 # the line the paws touch
HORIZON_Y = GROUND_Y + 0.55
BODY_Y = -0.4                   # height of the body centre while standing or running
LOOK_TURN = 1.3                 # how far the head turns toward the camera (radians)
LIE_DROP_FRONT, LIE_DROP_HIND = 0.98, 1.14   # how far shoulders and hips sink when lying

# ------------------------------------------------------------------ palette
FUR = "#16141e"
FUR_FAR = "#3a3050"
FUR_DETAIL = "#4a3d58"
SHEEN = "#3a3550"
NOSE = "#5c4a68"
RIM = "#ff9d5c"
EYE = "#ffc93c"
HEART = "#ff6f91"
SKY_TOP, SKY_MID, SKY_LOW = "#241a4a", "#a8437a", "#ffab5e"
SUN, SUN_CORE = "#ffd98f", "#fff1c9"
RIDGE_FAR, RIDGE_NEAR, TREE = "#c0607a", "#7a3463", "#43204a"
GROUND_HIGH, GROUND_LOW = "#e59a5a", "#8a4529"
TRACK, BITS_DARK, BITS_LIGHT = "#f7c890", "#8f4f2a", "#f6bf85"
GRASS_FG = "#3a1a14"
DUST = "#f3d2a6"

# leg bone lengths
FRONT_UPPER, FRONT_LOWER = 0.80, 0.74
HIND_THIGH, HIND_SHIN, HIND_FOOT = 0.72, 0.68, 0.42
PAW_LIFT = {"front": 0.55, "hind": 0.45}
PAW_CENTER = {"front": 1.25, "hind": -0.85}   # middle of each paw's ground stroke, relative to the body
# (leg, stride phase when the paw lands, near side?) in drawing order, back to front.
# Rotary gallop: both hinds land, extended flight, both fronts land, gathered flight.
LEGS = [("hind", 0.00, False), ("front", 0.50, False), ("hind", 0.10, True), ("front", 0.60, True)]
EXTENDED = 0.44                 # middle of the stretched-out flight (after the hinds push off)

# body thickness along the spine: spine position (0 = hip, 1 = shoulder), top edge, bottom edge
BODY_PROFILE = [
    (-0.27, 0.04, -0.08), (-0.21, 0.20, -0.22), (-0.11, 0.31, -0.31), (0.00, 0.38, -0.34), (0.15, 0.38, -0.24),
    (0.30, 0.35, -0.20), (0.50, 0.33, -0.26), (0.70, 0.37, -0.36), (0.88, 0.46, -0.44),
    (1.00, 0.50, -0.44), (1.12, 0.44, -0.36), (1.20, 0.30, -0.22), (1.27, 0.08, -0.02),
]

# ears as 3D triangles (forward, sideways, up) on the head: flattened for speed, or perked up
EAR_SWEPT = np.array([(0.00, 0.08, 0.22), (-0.24, 0.20, 0.12), (-0.36, 0.18, 0.40)])
EAR_PERKED = np.array([(0.06, 0.07, 0.24), (-0.14, 0.25, 0.16), (-0.06, 0.20, 0.50)])


# ------------------------------------------------------------------ geometry helpers
def v2(x, y):
    return np.array([float(x), float(y), 0.0])


def rot(p, ang):
    c, s = np.cos(ang), np.sin(ang)
    return np.array([c * p[0] - s * p[1], s * p[0] + c * p[1], 0.0])


def unit(v):
    n = np.linalg.norm(v)
    return v / n if n > 1e-9 else v


def lerp(a, b, k):
    return a + (b - a) * k


def wrap(x, width):
    return ((x + width / 2) % width) - width / 2


def ease(x):
    x = min(max(x, 0.0), 1.0)
    return 0.5 - 0.5 * np.cos(np.pi * x)


def bump(t, start, length):
    """Smoothly 0 -> 1 -> 0 across [start, start + length]."""
    x = min(max((t - start) / length, 0.0), 1.0)
    return np.sin(np.pi * x) ** 2


def solid(m, color, opacity=1.0):
    return m.set_fill(color, opacity).set_stroke(width=0)


def capsule(p, q, r1, r2, color):
    """A tapered limb segment: two circles joined by a quad."""
    d = unit(q - p)
    n = v2(-d[1], d[0])
    shape = VGroup(
        Polygon(p + n * r1, q + n * r2, q - n * r2, p - n * r1),
        Circle(radius=r1).move_to(p),
        Circle(radius=r2).move_to(q),
    )
    return solid(shape, color)


def blob(points, color):
    """A smooth closed shape through the given points."""
    m = VMobject()
    m.set_points_smoothly([*points, points[0]])
    return solid(m, color)


def curve(points):
    """A smooth open line through the given points."""
    return VMobject().set_points_smoothly(points).set_fill(opacity=0)


def tapered(points, widths, color):
    """A smooth ribbon along a polyline, thinning from widths[0] to widths[-1]."""
    left, right = [], []
    for i, p in enumerate(points):
        a = points[max(i - 1, 0)]
        b = points[min(i + 1, len(points) - 1)]
        t = unit(b - a)
        n = v2(-t[1], t[0])
        left.append(p + n * widths[i])
        right.append(p - n * widths[i])
    outline = left + right[::-1]
    ribbon = VMobject()
    ribbon.set_points_smoothly([*outline, outline[0]])
    return solid(VGroup(ribbon, Circle(radius=widths[-1]).move_to(points[-1])), color)


def ik(root, target, l1, l2, bend, soft=0.08):
    """Two-bone inverse kinematics. Returns (joint, end).
    bend=+1 puts the joint in front of the root-target line (a knee), -1 behind it (an elbow).
    Near full stretch the reach eases off instead of snapping the limb straight."""
    d_vec = target - root
    dist = np.linalg.norm(d_vec)
    start = l1 + l2 - soft
    if dist > start:
        dist = start + soft * (1 - np.exp(-(dist - start) / soft))
    dist = max(dist, abs(l1 - l2) + 1e-3)
    a = np.arccos(np.clip((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1))
    direction = unit(d_vec)
    joint = root + l1 * rot(direction, bend * a)
    return joint, root + direction * dist


# ------------------------------------------------------------------ story timeline
def gait(t):
    """1 = full gallop, 0 = standing still."""
    return 1.0 - ease((t - STOP_AT) / STOP_LEN)


def braking(t):
    return bump(t, STOP_AT, STOP_LEN)


def stride_freq(t):
    return FREQ * (0.45 + 0.55 * gait(t))   # strides get slower as well as shorter while stopping


def speed(t):
    return STRIDE * gait(t) * stride_freq(t) / DUTY


T_ARRIVE = (ARRIVE_X - START_X - SPEED * EASE / 2) / SPEED   # when the camera starts catching up


def screen_share(t):
    """How much of the panther's speed shows as motion across the screen.
    1 = camera still (panther runs in), 0 = camera tracks it (ground scrolls)."""
    return 1.0 - ease((t - T_ARRIVE) / EASE)


_TS = np.linspace(0, DURATION + 1, 12001)


def _integral(values):
    return np.concatenate([[0.0], np.cumsum((values[1:] + values[:-1]) / 2 * np.diff(_TS))])


_V = np.array([speed(t) for t in _TS])
_SH = np.array([screen_share(t) for t in _TS])
_PHASE = _integral(np.array([stride_freq(t) for t in _TS]))   # strides taken so far
_X = START_X + _integral(_V * _SH)
_SCROLL = _integral(_V * (1 - _SH))   # panther screen motion + ground scroll always = running speed


def panther_x(t):
    return float(np.interp(t, _TS, _X))


def scroll(t):
    return float(np.interp(t, _TS, _SCROLL))


def phase(t):
    return float(np.interp(t, _TS, _PHASE))


class Pose:
    """The dials that set the panther's shape at one moment."""

    def __init__(self, **dials):
        self.__dict__.update(dials)


def pose_at(t):
    happy = ease((t - HAPPY_AT) / 0.4)
    return Pose(
        t=t, x0=panther_x(t), u=phase(t) % 1.0, phase=phase(t),
        g=gait(t), brake=braking(t),
        lie_f=ease((t - LIE_AT) / 1.2),                 # shoulders go down first...
        lie_h=ease((t - LIE_AT - 0.6) / 1.4),           # ...then the hips settle
        turn=LOOK_TURN * ease((t - LOOK_AT) / LOOK_LEN),
        ears=ease((t - STOP_AT - 0.8) / 1.0),
        tilt=0.12 * ease((t - LOOK_AT - 0.3) / 0.8) + happy * (0.06 + 0.04 * np.sin(TAU * (t - HAPPY_AT) / 2.6)),
        eye_open=(1 - bump(t, BLINK_AT, BLINK_LEN)) * (1 - happy),
        happy=happy,
        smile=0.4 * ease((t - LOOK_AT) / 0.8) + 0.6 * happy,
    )


def run_pose(u):
    """A full-gallop pose at stride phase u, for the run-cycle sheet."""
    return Pose(t=0.0, x0=0.0, u=u % 1.0, phase=u, g=1.0, brake=0.0, lie_f=0.0, lie_h=0.0,
                turn=0.0, ears=0.0, tilt=0.0, eye_open=1.0, happy=0.0, smile=0.0)


# ------------------------------------------------------------------ body
def body_pose(p):
    """Spine flex (+1 stretched, -1 bunched), vertical bob and nose-up pitch."""
    w = TAU * (p.u - EXTENDED)
    flex = p.g * np.cos(w)
    bob = p.g * (0.065 * np.cos(2 * w) + 0.015 * np.cos(w))      # highest in the two flights
    bob += (1 - p.g) * 0.012 * np.sin(TAU * p.t / 2.4)            # slow breathing once it stops
    pitch = p.g * 0.05 * np.cos(TAU * (p.u - 0.20)) + 0.07 * p.brake   # leans back while braking
    return flex, bob, pitch


def spine(p):
    """The spine is a curve from hip (0) to shoulder (1) that stretches and arches with the stride
    and sinks when lying. Returns at(tau, offset): a spine point pushed offset along its normal."""
    flex, bob, pitch = body_pose(p)
    arch = 0.08 - 0.13 * flex                # the back rounds up when the legs bunch, flattens when stretched
    hx = -1.05 - 0.20 * flex                 # hip and shoulder spread apart as the spine stretches
    sx = 1.00 + 0.14 * flex
    centre = v2(p.x0, BODY_Y + bob)
    H = centre + rot(v2(hx, 0.0), pitch) - v2(0, LIE_DROP_HIND * p.lie_h)
    S = centre + rot(v2(sx, 0.0), pitch) - v2(0, LIE_DROP_FRONT * p.lie_f)
    d = unit(S - H)
    C = (H + S) / 2 + v2(-d[1], d[0]) * 2 * arch

    def at(tau, off):
        point = (1 - tau) ** 2 * H + 2 * tau * (1 - tau) * C + tau ** 2 * S
        t = unit(2 * (1 - tau) * (C - H) + 2 * tau * (S - C))
        return point + v2(-t[1], t[0]) * off

    return at


# ------------------------------------------------------------------ legs
def paw_path(u, landing, center, lift, stride):
    """Where a paw is (relative to the body, height above the ground) at stride phase u.
    Returns (pos, planted, progress 0..1 through the current stance or swing).
    The swing is a Hermite curve that leaves and meets the ground at ground speed, so the paw
    follows through behind after push-off and reaches past the landing spot before setting down."""
    p = (u - landing) % 1.0
    half = stride / 2
    if p < DUTY:
        s = p / DUTY
        return v2(center + half - stride * s, 0.0), True, s
    s = (p - DUTY) / (1 - DUTY)
    m = -stride / DUTY * (1 - DUTY) * FOLLOW
    h00, h10 = 2 * s**3 - 3 * s**2 + 1, s**3 - 2 * s**2 + s
    h01, h11 = -2 * s**3 + 3 * s**2, s**3 - s**2
    x = center - half * h00 + m * h10 + half * h01 + m * h11
    early = s * (1.6 - 0.6 * s)                   # the paw peaks early and sets down gently
    return v2(x, lift * np.sin(np.pi * early) ** 2), False, s


def front_joints(p, landing, near, shoulder):
    center = PAW_CENTER["front"] + 0.25 * p.brake + (0.0 if near else 0.14) * (1 - p.g)
    fp, planted, s = paw_path(p.u, landing, center, PAW_LIFT["front"] * p.g, STRIDE * p.g)
    reach = np.clip((fp[0] - center) / (STRIDE / 2), -1.4, 1.4)
    root = shoulder + v2(0.10 * reach, 0.03 * reach)    # the shoulder blade slides with the leg
    upright = v2(p.x0 + fp[0], GROUND_Y + 0.15 + fp[1])
    lying = v2(p.x0 + 2.2, GROUND_Y + (0.07 if near else 0.15))   # forelegs stretched out in front
    squash = 1 - 0.18 * p.lie_f                         # the folded arm tucks into the chest
    elbow, wrist = ik(root, lerp(upright, lying, p.lie_f), FRONT_UPPER * squash, FRONT_LOWER * squash, -1)
    if planted:   # paw flat, rolling onto the toes as it pushes off
        run_ang = -0.5 - 0.6 * ease(s)
    else:         # paw flips back under the wrist, then opens forward to land
        curl = np.sin(np.pi * s * (1.6 - 0.6 * s)) ** 2
        run_ang = -1.1 + 0.6 * ease(s) - 1.6 * curl
    return root, elbow, wrist, lerp(lerp(-0.5, run_ang, p.g), 0.0, p.lie_f)


def hind_joints(p, landing, near, hip):
    center = PAW_CENTER["hind"] + 0.12 * p.brake - (0.0 if near else 0.12) * (1 - p.g)
    fp, planted, s = paw_path(p.u, landing, center, PAW_LIFT["hind"] * p.g, STRIDE * p.g)
    upright = v2(p.x0 + fp[0], GROUND_Y + 0.065 + fp[1])
    lying = v2(p.x0 - 0.3 + (0.0 if near else 0.12), GROUND_Y + (0.065 if near else 0.12))
    paw = lerp(upright, lying, p.lie_h)
    # the foot leans back from paw to hock; the heel lifts through the push and folds in the swing,
    # and lies flat on the ground when the panther lies down
    run_lean = 0.35 + 0.5 * ease(s) if planted else 0.85 - 0.5 * ease(s) + 0.7 * np.sin(np.pi * s) ** 2
    lean = lerp(lerp(0.35, run_lean, p.g), 1.45, p.lie_h)
    want = paw + HIND_FOOT * v2(-np.sin(lean), np.cos(lean))
    knee, hock = ik(hip, want, HIND_THIGH, HIND_SHIN, +1)
    paw = paw + (hock - want)
    run_toe = 0.0 if planted else -1.1 * np.sin(np.pi * s) ** 2
    return knee, hock, paw, run_toe * p.g * (1 - p.lie_h)


def sheen_along(a, b, width, height, at=0.4):
    d = b - a
    e = Ellipse(width=width, height=height).rotate(np.arctan2(d[1], d[0])).move_to(a + at * d)
    return solid(e, SHEEN, 0.35)


def front_leg(p, landing, near, shoulder):
    color = FUR if near else FUR_FAR
    root, elbow, wrist, ang = front_joints(p, landing, near, shoulder)
    paw = Ellipse(width=0.28, height=0.13).rotate(ang).move_to(wrist + 0.11 * rot(RIGHT, ang))
    shape = VGroup(
        capsule(root, elbow, 0.27, 0.14, color),
        capsule(elbow, wrist, 0.13, 0.08, color),
        solid(paw, color),
    )
    return shape, VGroup(sheen_along(root, elbow, 0.48, 0.2)) if near else VGroup()


def hind_leg(p, landing, near, hip):
    color = FUR if near else FUR_FAR
    knee, hock, paw, toe = hind_joints(p, landing, near, hip)
    toes = Ellipse(width=0.30, height=0.13).rotate(toe).move_to(paw + rot(v2(0.08, 0), toe))
    shape = VGroup(
        capsule(hip, knee, 0.40, 0.16, color),
        capsule(knee, hock, 0.14, 0.075, color),
        capsule(hock, paw, 0.08, 0.065, color),
        solid(toes, color),
    )
    return shape, VGroup(sheen_along(hip, knee, 0.55, 0.28)) if near else VGroup()


# ------------------------------------------------------------------ head
def head_center(p, flex, bob):
    running = v2(p.x0 + 2.0 + 0.08 * flex, BODY_Y + 0.42 + 0.25 * bob)   # steadier than the body
    standing = v2(p.x0 + 1.92, BODY_Y + 0.62 + bob)                     # raised and alert
    lying = v2(p.x0 + 1.85, GROUND_Y + 1.3 + 0.5 * bob)                 # held up proudly above the paws
    return lerp(lerp(standing, running, p.g), lying, (p.lie_f + p.lie_h) / 2)


def head_parts(c, p):
    """The head as points on a 3D head (forward f, sideways n toward the viewer, up h),
    turned toward the camera by p.turn and projected to the screen."""
    cp, sp = np.cos(p.turn), np.sin(p.turn)
    look = p.turn / LOOK_TURN
    tilt = p.tilt + 0.035 * p.g * np.sin(TAU * (p.u - 0.1))

    def P(f, n, h):
        return c + rot(v2(f * cp - n * sp, h), tilt)

    def ell(width, height, centre, extra=0.0):
        return Ellipse(width=width, height=height).rotate(tilt + extra).move_to(centre)

    fur, details = VGroup(), VGroup()
    for side in (-1, 1):                         # far ear first
        corners = [P(*q) for q in lerp(EAR_SWEPT, EAR_PERKED, p.ears) * np.array([1, side, 1])]
        fur.add(Polygon(*corners).round_corners(0.03))
        mid = sum(corners) / 3
        facing = np.clip((0.9 * sp + side * 0.4 * cp) * 2, 0, 1)   # inner ear shows when it faces us
        if facing > 0.02:
            inner = Polygon(*[mid + (q - mid) * 0.55 for q in corners]).round_corners(0.015)
            details.add(solid(inner, FUR_DETAIL, facing))
    fur.add(ell(0.66 - 0.04 * look, 0.54, P(-0.02, 0, 0)))                       # skull
    for side in (-1, 1):
        fur.add(Circle(radius=0.16).move_to(P(0.08, side * 0.19, -0.10)))         # cheeks
    fur.add(ell(lerp(0.48, 0.34, look), lerp(0.30, 0.26, look), P(0.27, 0, -0.10)))   # muzzle
    fur.add(ell(lerp(0.32, 0.22, look), 0.15, P(0.20, 0, -0.22)))                # jaw
    solid(fur, FUR)

    details.add(solid(ell(lerp(0.30, 0.24, look), 0.15, P(0.30, 0, -0.08)), SHEEN, 0.5))
    for side in (-1, 1):
        facing = 0.75 * sp + side * 0.62 * cp
        if facing < 0.05:
            continue
        centre = P(0.13, side * 0.13, 0.06)
        w = min(0.16 * facing / 0.62, 0.2)
        h = lerp(0.085, 0.13, look)
        if p.eye_open > 0.12:
            details.add(solid(ell(w, h * p.eye_open, centre, -0.15 * (1 - look)), EYE))
            pupil = ell(w * lerp(0.22, 0.42, look), lerp(0.075, 0.11, look) * p.eye_open,
                        centre + rot(v2(0.02 * (1 - look), 0), tilt))
            details.add(solid(pupil, BLACK))
            if p.eye_open > 0.5:
                glint = Circle(radius=lerp(0.013, 0.024, look)).move_to(centre + rot(v2(-0.22 * w, 0.22 * h), tilt))
                details.add(solid(glint, WHITE, 0.9))
        elif p.happy < 0.5:                       # mid-blink: a closed lid
            details.add(Line(centre + rot(v2(-w / 2, 0), tilt), centre + rot(v2(w / 2, 0), tilt)).set_stroke(EYE, 3))
        if p.happy > 0.01:                        # happy closed eyes: ^ ^
            arc = curve([centre + rot(v2(-0.45 * w, -0.012), tilt), centre + rot(v2(0, 0.03), tilt),
                         centre + rot(v2(0.45 * w, -0.012), tilt)])
            details.add(arc.set_stroke(EYE, 4, p.happy))

    nc = P(0.44, 0, -0.03)
    nw, nh = lerp(0.07, 0.11, look), lerp(0.06, 0.075, look)
    nose = Polygon(nc + rot(v2(-nw / 2, nh / 2), tilt), nc + rot(v2(nw / 2, nh / 2), tilt),
                   nc + rot(v2(0, -nh / 2), tilt)).round_corners(0.015)
    details.add(solid(nose, NOSE))
    mouth = VGroup(Line(P(0.44, 0, -0.06), P(0.43, 0, -0.095)))
    for side in (-1, 1):                          # the cat "w" mouth, corners lifting into a smile
        mouth.add(curve([P(0.43, 0, -0.095), P(0.40, side * 0.05, -0.14),
                         P(0.30, side * 0.11, -0.13 + 0.05 * p.smile)]))
    details.add(mouth.set_stroke(NOSE, 2.2))
    for side in (-1, 1):
        for dy in (0.05, -0.01, -0.07):
            details.add(Line(P(0.36, side * 0.12, -0.09), P(0.62, side * 0.5, -0.07 + dy * 1.6))
                        .set_stroke("#d8d0e0", 1.2, 0.7))
    return fur, details


# ------------------------------------------------------------------ tail
def tail(at, p):
    """A long tail that leaves the rump along the line of the back. Galloping it streams out low;
    standing it lifts into a curl; lying it rests on the ground with the tip curled up.
    A gentle wave travels down it all the time."""
    base = at(-0.12, 0.17)
    back = at(-0.20, 0.17) - base                       # the back line, continued past the rump
    follow = np.arctan2(back[1], back[0]) % TAU         # ~PI: pointing backwards
    run_start = 0.6 * (follow + 0.25) + 0.4 * (PI + 0.35)   # follows the hips, but only partly
    start = lerp(lerp(PI + 0.15, run_start, p.g), PI + 0.6, p.lie_h)
    curl = lerp(lerp(1.5, 1.05, p.g), 1.75, p.lie_h)
    amp = lerp(0.3, 0.22, p.g)
    n, seg = 20, 0.13
    widths = np.interp(np.linspace(0, 1, n + 1), [0, 0.15, 1], [0.13, 0.095, 0.055])
    pts = [base]
    for i in range(1, n + 1):
        f = i / n
        ang = start - curl * f ** 1.6 + amp * f * np.sin(TAU * p.phase - 2.4 * f)
        nxt = pts[-1] + seg * v2(np.cos(ang), np.sin(ang))
        nxt[1] = max(nxt[1], GROUND_Y + widths[i])     # rests on the ground instead of sinking in
        pts.append(nxt)
    return tapered(pts, widths, FUR)


# ------------------------------------------------------------------ the whole panther
def panther(p):
    flex, bob, _ = body_pose(p)
    at = spine(p)
    hip, shoulder = at(0.0, -0.04), at(1.0, -0.12)
    far, near, gloss = VGroup(), VGroup(), VGroup()
    for kind, landing, is_near in LEGS:
        build = hind_leg if kind == "hind" else front_leg
        shape, shine = build(p, landing, is_near, hip if kind == "hind" else shoulder)
        (near if is_near else far).add(shape)
        gloss.add(shine)

    body = blob([at(tau, top) for tau, top, _ in BODY_PROFILE] +
                [at(tau, bottom) for tau, _, bottom in reversed(BODY_PROFILE)], FUR)
    back_shine = tapered([at(tau, 0.27) for tau in np.linspace(0.05, 0.95, 10)],
                         [0.012, 0.03, 0.045, 0.05, 0.05, 0.05, 0.05, 0.045, 0.03, 0.012], SHEEN)
    gloss.add(back_shine.set_fill(opacity=0.5))

    head_c = head_center(p, flex, bob)
    neck = capsule(at(1.05, 0.12), head_c + v2(-0.18, -0.06), 0.38, 0.26, FUR)
    head_fur, head_details = head_parts(head_c, p)

    silhouette = VGroup(tail(at, p), body, near, neck, head_fur)
    rim = silhouette.copy().set_fill(RIM, 1).shift(v2(0.035, 0.03))   # sunlight catching the front edges
    return VGroup(far, rim, silhouette, gloss, head_details)


def heart(c, size, opacity):
    th = np.linspace(0, TAU, 48, endpoint=False)
    xs = 16 * np.sin(th) ** 3
    ys = 13 * np.cos(th) - 5 * np.cos(2 * th) - 2 * np.cos(3 * th) - np.cos(4 * th)
    shape = blob([c + v2(x, y) * size / 32 for x, y in zip(xs, ys)], HEART).set_fill(opacity=opacity)
    shine = solid(Circle(radius=size * 0.1).move_to(c + v2(-0.2 * size, 0.12 * size)), WHITE, 0.7 * opacity)
    return VGroup(shape, shine)


def hearts(t, head_c):
    """Little hearts float up from the happy panther."""
    out = VGroup()
    for i, delay in enumerate((0.3, 0.9, 1.5, 2.1)):
        age = t - (HAPPY_AT + delay)
        if not 0 <= age < 2.0:
            continue
        a = age / 2.0
        pos = head_c + v2(-0.25 + 0.25 * i + 0.1 * np.sin(TAU * a * 1.3 + i), 0.6 + 1.2 * a)
        out.add(heart(pos, 0.34 * ease(a * 4), 1 - ease((a - 0.55) / 0.45)))
    return out


# ------------------------------------------------------------------ scenery
def sky():
    fw, fh = config.frame_width, config.frame_height
    bottom = HORIZON_Y - 0.3
    s = Rectangle(width=fw + 0.2, height=fh / 2 - bottom + 0.1).move_to(v2(0, (fh / 2 + bottom) / 2))
    return solid(s, [SKY_LOW, SKY_MID, SKY_TOP]).set_sheen_direction(UP)


def sun():
    c = v2(4.3, 0.25)
    glow = VGroup(*[solid(Circle(radius=1.0 + 0.12 * i).move_to(c), SUN, 0.022) for i in range(1, 21)])
    return VGroup(glow, solid(Circle(radius=1.0).move_to(c), SUN), solid(Circle(radius=0.8).move_to(c), SUN_CORE))


def ridge(shift, base, amp, color):
    xs = np.linspace(-8, 8, 90)
    z = xs + shift
    ys = base + amp * (0.55 * np.sin(0.33 * z + 0.7) + 0.30 * np.sin(0.81 * z + 2.1) + 0.15 * np.sin(1.7 * z + 0.3))
    pts = [v2(x, y) for x, y in zip(xs, ys)] + [v2(8, HORIZON_Y - 0.3), v2(-8, HORIZON_Y - 0.3)]
    return solid(Polygon(*pts), color)


def acacia(x, base, h, color):
    return solid(VGroup(
        capsule(v2(x, base), v2(x + 0.05 * h, base + 0.62 * h), 0.05 * h, 0.03 * h, color),
        capsule(v2(x + 0.04 * h, base + 0.55 * h), v2(x - 0.32 * h, base + 0.86 * h), 0.025 * h, 0.018 * h, color),
        capsule(v2(x + 0.05 * h, base + 0.60 * h), v2(x + 0.35 * h, base + 0.88 * h), 0.025 * h, 0.018 * h, color),
        Ellipse(width=1.35 * h, height=0.20 * h).move_to(v2(x, base + 0.93 * h)),
        Ellipse(width=0.80 * h, height=0.17 * h).move_to(v2(x - 0.32 * h, base + 0.86 * h)),
        Ellipse(width=0.75 * h, height=0.16 * h).move_to(v2(x + 0.36 * h, base + 0.89 * h)),
    ), color)


TREES = [(-9.0, 2.0), (-2.5, 1.5), (4.0, 2.3), (9.5, 1.7)]


def far_layers(t):
    g = scroll(t)
    trees = VGroup(*[acacia(wrap(x - 0.28 * g, 24), HORIZON_Y - 0.05, h, TREE) for x, h in TREES])
    return VGroup(ridge(0.06 * g, -0.75, 0.55, RIDGE_FAR), ridge(0.14 * g + 5, -1.15, 0.4, RIDGE_NEAR), trees)


def ground():
    fw, fh = config.frame_width, config.frame_height
    h = HORIZON_Y + fh / 2 + 0.1
    soil = solid(Rectangle(width=fw + 0.2, height=h).move_to(v2(0, HORIZON_Y - h / 2)), [GROUND_LOW, GROUND_HIGH])
    soil.set_sheen_direction(UP)
    track = solid(Rectangle(width=fw + 0.2, height=0.45).move_to(v2(0, GROUND_Y - 0.08)), TRACK, 0.25)
    edge = solid(Rectangle(width=fw + 0.2, height=0.05).move_to(v2(0, HORIZON_Y)), "#ffd59a", 0.9)
    return VGroup(soil, track, edge)


_rng = np.random.default_rng(7)
GROUND_BITS = [(_rng.uniform(-11, 11), _rng.uniform(-3.95, HORIZON_Y - 0.08),
                _rng.choice(["tuft", "pebble", "dash"], p=[0.4, 0.25, 0.35])) for _ in range(46)]
FG_GRASS = [(-9.0, 1.0), (-3.5, 0.75), (2.0, 1.1), (7.5, 0.85), (11.0, 0.7)]


def depth_speed(y):
    """Ground nearer the viewer (lower on screen) slides past faster."""
    return 1 + 0.45 * (GROUND_Y - y)


def ground_bits(t):
    g = scroll(t)
    out = VGroup()
    for x0, y, kind in GROUND_BITS:
        x = wrap(x0 - g * depth_speed(y), 22)
        z = 0.5 + 0.35 * (HORIZON_Y - y)
        if kind == "tuft":
            out.add(solid(VGroup(*[Polygon(v2(x - 0.04 * z, y), v2(x + 0.04 * z, y), v2(x + dx * z, y + hh * z))
                                   for dx, hh in [(-0.12, 0.22), (0.02, 0.30), (0.14, 0.20)]]), BITS_DARK))
        elif kind == "pebble":
            out.add(solid(Ellipse(width=0.13 * z, height=0.06 * z).move_to(v2(x, y)), BITS_DARK, 0.8))
        else:
            out.add(solid(Rectangle(width=0.5 * z, height=0.025 * z).move_to(v2(x, y)), BITS_LIGHT, 0.6))
    return out


def foreground(t):
    g = scroll(t)
    out = VGroup()
    for x0, h in FG_GRASS:
        x = wrap(x0 - 2.3 * g, 26)
        out.add(solid(VGroup(*[Polygon(v2(x + dx - 0.07, -4.2), v2(x + dx + 0.07, -4.2), v2(x + dx + lean, -4.2 + hh * h))
                               for dx, lean, hh in [(-0.25, -0.35, 0.8), (-0.1, -0.1, 1.0), (0.05, 0.15, 1.15),
                                                    (0.2, 0.4, 0.85), (0.3, 0.6, 0.6)]]), GRASS_FG))
    return out


def speed_lines(t):
    strength = (1 - screen_share(t)) * gait(t) ** 2
    out = VGroup()
    if strength < 0.01:
        return out
    for y, off, length in [(-1.1, 0.0, 1.6), (-0.55, 0.37, 2.1), (-0.05, 0.71, 1.4), (0.4, 0.18, 1.8), (0.75, 0.55, 1.2)]:
        q = (t * 1.3 + off) % 1
        x = -2.0 - 6 * q
        out.add(Line(v2(x - length, y), v2(x, y)).set_stroke(WHITE, 2, 0.35 * np.sin(np.pi * q) * strength))
    return out


def dust(t):
    """A puff where each paw pushes off; it stays with the ground and fades. Bigger while braking."""
    out = VGroup()
    life = 0.6
    ph = phase(t)
    for kind, landing, near in LEGS:
        n = np.floor(ph - landing - DUTY)
        for k in (n - 1, n):
            event = k + landing + DUTY
            if event < 0:
                continue
            tc = float(np.interp(event, _PHASE, _TS))
            age = t - tc
            g, b = gait(tc), braking(tc)
            if not 0 <= age < life or g < 0.05:
                continue
            a = age / life
            size = (1.0 if kind == "hind" else 0.7) * g * (1 + 1.2 * b)
            reach = (0.25 if kind == "front" else 0.12) * b
            x = panther_x(tc) + PAW_CENTER[kind] + reach - STRIDE * g / 2 - (scroll(t) - scroll(tc)) - 0.7 * age * g
            for dx, dy, r in [(0, 0, 1.0), (-0.15, 0.06, 0.8), (0.1, 0.1, 0.6)]:
                puff = Circle(radius=size * r * (0.07 + 0.3 * a))
                puff.move_to(v2(x + dx * (1 + 2 * a), GROUND_Y + 0.05 + dy + 0.35 * a * size))
                out.add(solid(puff, DUST, 0.45 * (1 - a) ** 1.5 * (1 if near else 0.6)))
    return out


def action(t):
    p = pose_at(t)
    flex, bob, _ = body_pose(p)
    lie = (p.lie_f + p.lie_h) / 2
    shadow = Ellipse(width=3.4 + 0.5 * lie, height=0.22 + 0.08 * lie).move_to(v2(p.x0 + 0.1 + 0.2 * lie, GROUND_Y - 0.02))
    return VGroup(speed_lines(t), solid(shadow, "#5a2a1a", 0.45 - bob + 0.1 * lie), panther(p), dust(t),
                  hearts(t, head_center(p, flex, bob)))


# ------------------------------------------------------------------ scenes
class PantherRun(MovingCameraScene):
    def construct(self):
        clock = ValueTracker(0.0)
        T = clock.get_value
        frame = self.camera.frame
        full_width = frame.width

        def follow_camera(m):
            z = ease((T() - ZOOM_AT) / ZOOM_LEN)
            m.set_width(lerp(full_width, ZOOM_WIDTH, z)).move_to(lerp(ORIGIN, v2(*ZOOM_CENTRE), z))

        frame.add_updater(follow_camera)
        self.add(frame)
        self.add(sky(), sun())
        self.add(always_redraw(lambda: far_layers(T())))
        self.add(ground())
        self.add(always_redraw(lambda: ground_bits(T())))
        self.add(always_redraw(lambda: action(T())))
        self.add(always_redraw(lambda: foreground(T())))
        self.play(clock.animate.set_value(DURATION), run_time=DURATION, rate_func=linear)


def _sheet(scene, poses, labels):
    scene.camera.background_color = "#f4e6d0"
    cells = VGroup()
    for p, label in zip(poses, labels):
        text = Text(label, font_size=44, color="#333333").move_to(v2(0, 1.6))
        floor = Line(v2(-3.6, GROUND_Y), v2(3.2, GROUND_Y)).set_stroke("#8a4529", 4)
        cells.add(VGroup(text, floor, panther(p)))
    cells.scale(0.5).arrange_in_grid(rows=2, cols=4, buff=(0.35, 0.5))
    scene.add(cells)


class RunCycle(Scene):
    """Eight poses through one stride, for checking and tweaking the gait."""

    def construct(self):
        _sheet(self, [run_pose(i / 8) for i in range(8)], [f"u = {i / 8:.3f}" for i in range(8)])


class StoryPoses(Scene):
    """Eight moments of the story, for checking the stop, the look and the lie-down."""

    def construct(self):
        times = [5.6, 6.3, 7.0, 7.6, 9.3, 9.9, 10.7, 12.0]
        poses = []
        for t in times:
            p = pose_at(t)
            p.x0 = 0.0
            poses.append(p)
        _sheet(self, poses, [f"t = {t:.1f}s" for t in times])
