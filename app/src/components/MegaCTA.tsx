import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  Path,
  Text as SvgText,
  TextPath,
} from "react-native-svg";
import { COLORS, FONTS } from "../constants/theme";

// Circular animated CTA. Lots of simultaneous motion:
//   - outer rotating dashed hazard ring (14s)
//   - inner rotating ring (22s reverse) with conic indicator
//   - orbital text "AURA MEASUREMENT STATION · ..." (28s spin)
//   - core hazard fill, breathing scale + glow (2.4s)
//   - hazard tape stripe across middle of core
//   - 3 staggered pulse rings shooting out (2s)
//   - arrow nudge (1.4s)
//   - corner ticks (static)
//   - tap state: motion freezes 60ms then slam-cuts
// Spec: docs/design/system/project/preview/components-cta.html

const STAGE = 320;        // outer container
const CTA   = 200;        // core button diameter
const RING  = 300;        // outer dashed ring diameter
const RING2 = 268;        // inner ring diameter
const TEXT_RADIUS = 142;  // SVG path radius for orbital text

interface MegaCTAProps {
  onPress: () => void;
  topLeft?: string;
  topRight?: string;
  bottomLeft?: string;
  bottomRight?: string;
  label?: string;
  eyebrow?: string;
}

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export default function MegaCTA({
  onPress,
  topLeft = "▌ 16+ ONLY",
  topRight = "N°02947",
  bottomLeft = "04.28.26",
  bottomRight = "NO CAP",
  label = "GET\nCOOKED.",
  eyebrow = "▌ TAP TO COOK",
}: MegaCTAProps) {
  // ─── Animations ───
  const ringOuter  = useRef(new Animated.Value(0)).current;
  const ringInner  = useRef(new Animated.Value(0)).current;
  const orbitText  = useRef(new Animated.Value(0)).current;
  const breathe    = useRef(new Animated.Value(0)).current;
  const arrowX     = useRef(new Animated.Value(0)).current;
  const pulse1     = useRef(new Animated.Value(0)).current;
  const pulse2     = useRef(new Animated.Value(0)).current;
  const pulse3     = useRef(new Animated.Value(0)).current;
  const tapScale   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Spinning rings — separate forward/reverse loops.
    const outer = Animated.loop(
      Animated.timing(ringOuter, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: true })
    );
    const inner = Animated.loop(
      Animated.timing(ringInner, { toValue: 1, duration: 22000, easing: Easing.linear, useNativeDriver: true })
    );
    const orbit = Animated.loop(
      Animated.timing(orbitText, { toValue: 1, duration: 28000, easing: Easing.linear, useNativeDriver: true })
    );

    // Breathing core (2.4s). Drives both scale + glow opacity.
    const br = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    // Arrow nudge (1.4s)
    const nudge = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowX, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(arrowX, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    // Pulse rings — staggered every 0.66s
    const makePulse = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 2000, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
    const p1 = makePulse(pulse1, 0);
    const p2 = makePulse(pulse2, 660);
    const p3 = makePulse(pulse3, 1320);

    [outer, inner, orbit, br, nudge, p1, p2, p3].forEach((a) => a.start());
    return () => {
      [outer, inner, orbit, br, nudge, p1, p2, p3].forEach((a) => a.stop());
    };
  }, [ringOuter, ringInner, orbitText, breathe, arrowX, pulse1, pulse2, pulse3]);

  const handlePress = () => {
    // Snap-down then slam-cut after 60ms (per design motion spec).
    Animated.timing(tapScale, {
      toValue: 0.96,
      duration: 60,
      useNativeDriver: true,
    }).start(() => {
      onPress();
      // Reset for next time
      Animated.timing(tapScale, {
        toValue: 1,
        duration: 0,
        useNativeDriver: true,
      }).start();
    });
  };

  // ─── Interpolations ───
  const outerSpin = ringOuter.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const innerSpin = ringInner.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-360deg"] });
  const orbitSpin = orbitText.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const breatheScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] });
  const arrowDx     = arrowX.interpolate({   inputRange: [0, 1], outputRange: [0, 4] });

  // Pulse rings: scale 1 → 1.55, opacity 0.9 → 0
  const pulseScale = (v: Animated.Value) =>
    v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] });
  const pulseOpacity = (v: Animated.Value) =>
    v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] });

  return (
    <View style={styles.stage}>
      {/* Corner ticks */}
      <Text style={[styles.tick, styles.tickTL]}>{topLeft}</Text>
      <Text style={[styles.tick, styles.tickTR]}>{topRight}</Text>
      <Text style={[styles.tick, styles.tickBL]}>{bottomLeft}</Text>
      <Text style={[styles.tick, styles.tickBR]}>{bottomRight}</Text>

      {/* Outer rotating dashed ring (RN can't do dashed borders cleanly on
          rounded views — approximate with SVG circle + strokeDasharray) */}
      <Animated.View
        style={[
          styles.ringWrap,
          { width: RING, height: RING, transform: [{ rotate: outerSpin }] },
        ]}
        pointerEvents="none"
      >
        <Svg width={RING} height={RING}>
          <Circle
            cx={RING / 2}
            cy={RING / 2}
            r={RING / 2 - 2}
            stroke={COLORS.hazard}
            strokeWidth={2}
            strokeDasharray="6 8"
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* Inner rotating ring with indicator arc */}
      <Animated.View
        style={[
          styles.ringWrap,
          { width: RING2, height: RING2, transform: [{ rotate: innerSpin }] },
        ]}
        pointerEvents="none"
      >
        <Svg width={RING2} height={RING2}>
          <Circle
            cx={RING2 / 2}
            cy={RING2 / 2}
            r={RING2 / 2 - 1}
            stroke={COLORS.hazard25}
            strokeWidth={1}
            fill="none"
          />
          {/* Indicator arc — short hazard segment */}
          <Circle
            cx={RING2 / 2}
            cy={RING2 / 2}
            r={RING2 / 2 - 1}
            stroke={COLORS.hazard}
            strokeWidth={3}
            strokeDasharray={`${(RING2 * Math.PI * 0.04).toFixed(2)} ${(RING2 * Math.PI).toFixed(2)}`}
            strokeDashoffset={0}
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* Orbital text "AURA MEASUREMENT STATION · ..." */}
      <Animated.View
        style={[
          styles.ringWrap,
          { width: STAGE, height: STAGE, transform: [{ rotate: orbitSpin }] },
        ]}
        pointerEvents="none"
      >
        <Svg width={STAGE} height={STAGE}>
          <Defs>
            <Path
              id="circ"
              d={`M ${STAGE / 2},${STAGE / 2} m -${TEXT_RADIUS},0 a ${TEXT_RADIUS},${TEXT_RADIUS} 0 1,1 ${TEXT_RADIUS * 2},0 a ${TEXT_RADIUS},${TEXT_RADIUS} 0 1,1 -${TEXT_RADIUS * 2},0`}
            />
          </Defs>
          <SvgText
            fill={COLORS.hazard}
            fontFamily={FONTS.monoBold}
            fontSize="9"
            letterSpacing="3"
          >
            <TextPath href="#circ" startOffset="0">
              ◉ AURA MEASUREMENT STATION · CALIBRATING · SIGMA DETECTED · NO CAP VERIFIED ·{" "}
            </TextPath>
          </SvgText>
        </Svg>
      </Animated.View>

      {/* Pulse rings (3 staggered) */}
      {[
        { v: pulse1, key: "p1" },
        { v: pulse2, key: "p2" },
        { v: pulse3, key: "p3" },
      ].map(({ v, key }) => (
        <Animated.View
          key={key}
          style={[
            styles.pulse,
            {
              transform: [{ scale: pulseScale(v) }],
              opacity: pulseOpacity(v),
            },
          ]}
          pointerEvents="none"
        />
      ))}

      {/* Core CTA */}
      <TouchableOpacity activeOpacity={1} onPress={handlePress}>
        <Animated.View
          style={[
            styles.cta,
            {
              transform: [{ scale: Animated.multiply(breatheScale, tapScale) }],
            },
          ]}
        >
          {/* Hazard tape diagonal stripe across middle (SVG) */}
          <View style={styles.tapeWrap} pointerEvents="none">
            <Svg width={CTA + 20} height={14} viewBox={`0 0 ${CTA + 20} 14`}>
              {Array.from({ length: 22 }).map((_, i) => (
                <Path
                  key={i}
                  d={`M ${i * 16 - 14} 14 L ${i * 16 + 8} 0 L ${i * 16 + 16} 0 L ${i * 16 - 6} 14 Z`}
                  fill={COLORS.ink}
                  fillOpacity={0.18}
                />
              ))}
            </Svg>
          </View>

          <Text style={styles.eyebrow}>{eyebrow}</Text>
          {label.split("\n").map((line, i) => (
            <Text key={i} style={styles.label}>{line}</Text>
          ))}
          <Animated.Text style={[styles.arrow, { transform: [{ translateX: arrowDx }] }]}>
            →
          </Animated.Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  stage: {
    width: STAGE,
    height: STAGE,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },

  tick: {
    position: "absolute",
    fontFamily: FONTS.monoBold,
    fontSize: 9,
    letterSpacing: 2,
    color: COLORS.hazard,
  },
  tickTL: { top: -6, left: 0 },
  tickTR: { top: -6, right: 0 },
  tickBL: { bottom: -6, left: 0 },
  tickBR: { bottom: -6, right: 0 },

  ringWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },

  pulse: {
    position: "absolute",
    width: CTA,
    height: CTA,
    borderRadius: CTA / 2,
    borderWidth: 2,
    borderColor: COLORS.hazard,
  },

  cta: {
    width: CTA,
    height: CTA,
    borderRadius: CTA / 2,
    backgroundColor: COLORS.hazard,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    // Stacked outer rings via shadow + 6px ink gap. RN limit: only one shadow,
    // so we use elevation-style glow + render the rings via SVG above the core.
    shadowColor: COLORS.hazard,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 30,
    // Border simulating the 6px ink gap + 7px hazard-25 ring of the spec.
    borderWidth: 6,
    borderColor: COLORS.ink,
  },

  tapeWrap: {
    position: "absolute",
    top: CTA / 2 - 7 - 6, // accounts for inner ring border
    left: -10,
    right: -10,
    height: 14,
    overflow: "hidden",
  },

  eyebrow: {
    fontFamily: FONTS.monoBold,
    fontSize: 9,
    letterSpacing: 3,
    color: COLORS.ink,
    opacity: 0.7,
    marginBottom: 4,
    zIndex: 2,
  },
  label: {
    fontFamily: FONTS.display,
    fontSize: 44,
    lineHeight: 38,
    letterSpacing: -1.5,
    color: COLORS.ink,
    textAlign: "center",
    zIndex: 2,
    paddingTop: 4,
  },
  arrow: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: COLORS.ink,
    marginTop: 6,
    zIndex: 2,
  },
});
