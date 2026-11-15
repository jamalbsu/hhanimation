from manim import *

BLACK_FUR = "#1b1b2a"
GOLD = "#f5c542"


class PantherHello(Scene):
    def construct(self):
        self.camera.background_color = "#0e1630"

        # Head and ears
        head = Circle(radius=1.6, color=BLACK_FUR, fill_opacity=1, stroke_color=GOLD, stroke_width=4)
        ear_l = Triangle(color=BLACK_FUR, fill_opacity=1, stroke_color=GOLD, stroke_width=4)
        ear_l.scale(0.6).move_to(head.get_center() + LEFT * 1.1 + UP * 1.45).rotate(20 * DEGREES)
        ear_r = ear_l.copy().flip(UP, about_point=head.get_center())

        # Eyes
        def eye(x):
            white = Ellipse(width=0.75, height=0.55, color=GOLD, fill_opacity=1, stroke_width=0)
            pupil = Ellipse(width=0.16, height=0.45, color=BLACK, fill_opacity=1, stroke_width=0)
            return VGroup(white, pupil).move_to(head.get_center() + RIGHT * x + UP * 0.35)

        eye_l, eye_r = eye(-0.65), eye(0.65)

        # Nose, mouth, whiskers
        nose = Triangle(color="#e88a9a", fill_opacity=1, stroke_width=0).scale(0.16).rotate(PI)
        nose.move_to(head.get_center() + DOWN * 0.35)
        mouth = VGroup(
            ArcBetweenPoints(nose.get_bottom(), nose.get_bottom() + LEFT * 0.4 + DOWN * 0.25, angle=-PI / 2),
            ArcBetweenPoints(nose.get_bottom(), nose.get_bottom() + RIGHT * 0.4 + DOWN * 0.25, angle=PI / 2),
        ).set_stroke(GOLD, 4)
        whiskers = VGroup(*[
            Line(ORIGIN, side * 1.0 + UP * dy, stroke_width=2, color=WHITE).shift(
                head.get_center() + side * 0.55 + DOWN * 0.5
            )
            for side in (LEFT, RIGHT)
            for dy in (-0.15, 0.0, 0.15)
        ])

        panther = VGroup(ear_l, ear_r, head, eye_l, eye_r, nose, mouth, whiskers).shift(UP * 0.6)
        title = Text("Panthers Pack", font_size=64, color=GOLD, weight=BOLD).next_to(panther, DOWN, buff=0.6)
        sub = Text("made with Manim", font_size=30, color=WHITE).next_to(title, DOWN, buff=0.25)

        # Animate
        self.play(FadeIn(ear_l, ear_r, shift=DOWN * 0.3), GrowFromCenter(head), run_time=1)
        self.play(FadeIn(eye_l, eye_r, scale=0.3), FadeIn(nose), Create(mouth), Create(whiskers), run_time=1)

        # Blink twice
        for _ in range(2):
            self.play(
                eye_l.animate.stretch(0.08, 1), eye_r.animate.stretch(0.08, 1), run_time=0.12
            )
            self.play(
                eye_l.animate.stretch(1 / 0.08, 1), eye_r.animate.stretch(1 / 0.08, 1), run_time=0.12
            )
            self.wait(0.4)

        # Bounce and title
        self.play(panther.animate.shift(UP * 0.5), rate_func=there_and_back, run_time=0.5)
        self.play(Write(title), run_time=1.2)
        self.play(FadeIn(sub, shift=UP * 0.2), Wiggle(panther, scale_value=1.05), run_time=1)
        self.wait(1)
