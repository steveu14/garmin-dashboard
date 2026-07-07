"""
Transcribed from https://github.com/steveu14/marathon-training/blob/main/index.html
Each week's start date (Monday) is given explicitly so real dates can be computed.
Year is 2026 throughout (race day Oct 18, 2026).
"""

PLAN = [
    {"phase": "Build 1", "weeks": [
        {"n": 1, "start": "2026-06-15", "days": [
            {"d": "Mon", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Full rest. Sleep, hydrate, foam roll."},
            {"d": "Tue", "type": "easy", "badge": "Easy run", "km": 8.0, "pace": "6:30-6:50/km", "instr": "Conversational pace throughout. HR <145 bpm. If you can't talk, slow down."},
            {"d": "Wed", "type": "medium", "badge": "Medium run", "km": 10.0, "pace": "6:00-6:30/km", "instr": "Steady aerobic effort. Comfortable but purposeful - not easy, not hard."},
            {"d": "Thu", "type": "easy", "badge": "Easy run", "km": 8.0, "pace": "6:30-6:50/km", "instr": "Easy recovery run. Flush out any fatigue from Wednesday."},
            {"d": "Fri", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Rest or optional cross-training (yoga, swim, easy cycle)."},
            {"d": "Sat", "type": "pace", "badge": "Pace run", "km": 8.0, "pace": "5:20-5:30/km", "instr": "Goal marathon pace. Lock in and hold - this is your race rehearsal."},
            {"d": "Sun", "type": "long", "badge": "Long run", "km": 14.0, "pace": "6:30-7:00/km", "instr": "Long slow distance. Easy and conversational the entire way."},
        ]},
        {"n": 2, "start": "2026-06-22", "days": [
            {"d": "Mon", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Full rest. Sleep, hydrate, foam roll."},
            {"d": "Tue", "type": "easy", "badge": "Easy run", "km": 8.0, "pace": "6:30-6:50/km", "instr": "Conversational pace. HR <145 bpm."},
            {"d": "Wed", "type": "medium", "badge": "Medium run", "km": 11.0, "pace": "6:00-6:30/km", "instr": "Steady aerobic effort. Comfortable but purposeful."},
            {"d": "Thu", "type": "easy", "badge": "Easy run", "km": 8.0, "pace": "6:30-6:50/km", "instr": "Easy recovery run. Keep it relaxed."},
            {"d": "Fri", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Rest or optional cross-training."},
            {"d": "Sat", "type": "pace", "badge": "Pace run", "km": 8.0, "pace": "5:20-5:30/km", "instr": "Goal marathon pace. Race rehearsal."},
            {"d": "Sun", "type": "long", "badge": "Long run", "km": 16.0, "pace": "6:30-7:00/km", "instr": "Long slow distance. Easy and conversational."},
        ]},
    ]},
    {"phase": "Recovery", "weeks": [
        {"n": 3, "start": "2026-06-29", "days": [
            {"d": "Mon", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Full rest. Sleep, hydrate, foam roll."},
            {"d": "Tue", "type": "easy", "badge": "Easy run", "km": 6.0, "pace": "6:30-6:50/km", "instr": "Easy run. Recovery week - shorter and lighter."},
            {"d": "Wed", "type": "medium", "badge": "Medium run", "km": 10.0, "pace": "6:00-6:30/km", "instr": "Steady aerobic. Recovery week - don't push it."},
            {"d": "Thu", "type": "easy", "badge": "Easy run", "km": 6.0, "pace": "6:30-6:50/km", "instr": "Easy recovery run."},
            {"d": "Fri", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Rest or optional cross-training."},
            {"d": "Sat", "type": "pace", "badge": "Pace run", "km": 6.0, "pace": "5:20-5:30/km", "instr": "Short pace run. Just a taste - don't overdo it."},
            {"d": "Sun", "type": "long", "badge": "Long run", "km": 13.0, "pace": "6:30-7:00/km", "instr": "Recovery long run. Shorter and easier than last week."},
        ]},
    ]},
    {"phase": "Build 2", "weeks": [
        {"n": 4, "start": "2026-07-06", "days": [
            {"d": "Mon", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Full rest. Sleep, hydrate, foam roll."},
            {"d": "Tue", "type": "easy", "badge": "Easy run", "km": 8.0, "pace": "6:30-6:50/km", "instr": "Conversational pace. HR <145 bpm."},
            {"d": "Wed", "type": "medium", "badge": "Medium run", "km": 13.0, "pace": "5:50-6:20/km", "instr": "Medium effort with light progression. Start at 6:20/km, build to 5:50 in the final third."},
            {"d": "Thu", "type": "easy", "badge": "Easy run", "km": 8.0, "pace": "6:30-6:50/km", "instr": "Easy recovery run. Flush out Wednesday fatigue."},
            {"d": "Fri", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Rest or optional cross-training."},
            {"d": "Sat", "type": "pace", "badge": "Pace run", "km": 10.0, "pace": "5:20-5:30/km", "instr": "Goal marathon pace. Hold it steady."},
            {"d": "Sun", "type": "long", "badge": "Long run", "km": 19.0, "pace": "6:30-7:00/km", "instr": "Long slow distance. Start fuelling practice - gel every 45 min."},
        ]},
    ]},
    {"phase": "Recovery", "weeks": [
        {"n": 5, "start": "2026-07-13", "days": [
            {"d": "Mon", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Full rest. Sleep, hydrate, foam roll."},
            {"d": "Tue", "type": "easy", "badge": "Easy run", "km": 8.0, "pace": "6:30-6:50/km", "instr": "Easy run. Recovery week."},
            {"d": "Wed", "type": "medium", "badge": "Medium run", "km": 11.0, "pace": "5:50-6:20/km", "instr": "Medium effort. Recovery week - keep it comfortable."},
            {"d": "Thu", "type": "easy", "badge": "Easy run", "km": 8.0, "pace": "6:30-6:50/km", "instr": "Easy recovery run."},
            {"d": "Fri", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Rest or optional cross-training."},
            {"d": "Sat", "type": "pace", "badge": "Pace run", "km": 8.0, "pace": "5:20-5:30/km", "instr": "Goal marathon pace. Short and controlled."},
            {"d": "Sun", "type": "long", "badge": "Long run", "km": 16.0, "pace": "6:30-7:00/km", "instr": "Recovery long run. Back off from last week."},
        ]},
    ]},
    {"phase": "Build 3", "weeks": [
        {"n": 6, "start": "2026-07-20", "days": [
            {"d": "Mon", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Full rest. Sleep, hydrate, foam roll."},
            {"d": "Tue", "type": "easy", "badge": "Easy run", "km": 10.0, "pace": "6:30-6:50/km", "instr": "Conversational pace. HR <145 bpm."},
            {"d": "Wed", "type": "medium", "badge": "Medium run", "km": 13.0, "pace": "5:50-6:20/km", "instr": "Medium effort with progression. Build through the run."},
            {"d": "Thu", "type": "easy", "badge": "Easy run", "km": 10.0, "pace": "6:30-6:50/km", "instr": "Easy recovery run."},
            {"d": "Fri", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Rest or optional cross-training."},
            {"d": "Sat", "type": "pace", "badge": "Pace run", "km": 10.0, "pace": "5:20-5:30/km", "instr": "Goal marathon pace. Feeling strong? Good - stay disciplined."},
            {"d": "Sun", "type": "long", "badge": "Long run", "km": 22.0, "pace": "6:30-7:00/km", "instr": "Long slow distance. Fuel every 45 min."},
        ]},
    ]},
    {"phase": "Recovery", "weeks": [
        {"n": 7, "start": "2026-07-27", "days": [
            {"d": "Mon", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Full rest. Sleep, hydrate, foam roll."},
            {"d": "Tue", "type": "easy", "badge": "Easy run", "km": 8.0, "pace": "6:30-6:50/km", "instr": "Easy run. Recovery week."},
            {"d": "Wed", "type": "medium", "badge": "Medium run", "km": 11.0, "pace": "5:50-6:20/km", "instr": "Medium effort. Recovery week - don't push."},
            {"d": "Thu", "type": "easy", "badge": "Easy run", "km": 8.0, "pace": "6:30-6:50/km", "instr": "Easy recovery run."},
            {"d": "Fri", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Rest or optional cross-training."},
            {"d": "Sat", "type": "pace", "badge": "Pace run", "km": 8.0, "pace": "5:20-5:30/km", "instr": "Goal marathon pace. Short and easy."},
            {"d": "Sun", "type": "long", "badge": "Long run", "km": 18.0, "pace": "6:30-7:00/km", "instr": "Recovery long run. Back off from last week."},
        ]},
    ]},
    {"phase": "Peak 1", "weeks": [
        {"n": 8, "start": "2026-08-03", "days": [
            {"d": "Mon", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Full rest. Sleep, hydrate, foam roll."},
            {"d": "Tue", "type": "easy", "badge": "Easy run", "km": 8.0, "pace": "6:30-6:50/km", "instr": "Conversational pace. HR <145 bpm."},
            {"d": "Wed", "type": "tempo", "badge": "Tempo run", "km": 14.0, "pace": "5:00-5:10 (tempo) / 6:30+ (W/U+C/D)", "instr": "2 km easy warm-up, 10 km at 5:00-5:10/km (comfortably hard, ~20s slower than your LT of 4:43), 2 km easy cool-down."},
            {"d": "Thu", "type": "easy", "badge": "Easy run", "km": 8.0, "pace": "6:30-6:50/km", "instr": "Easy recovery run after tempo. No exceptions on the pace today."},
            {"d": "Fri", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Rest or optional cross-training."},
            {"d": "Sat", "type": "pace", "badge": "Pace run", "km": 11.0, "pace": "5:20-5:30/km", "instr": "Goal marathon pace. This is the race rehearsal that counts."},
            {"d": "Sun", "type": "long", "badge": "Long run", "km": 26.0, "pace": "6:30-7:00/km", "instr": "Your longest run so far. Easy throughout. Fuel every 45 min."},
        ]},
    ]},
    {"phase": "Recovery", "weeks": [
        {"n": 9, "start": "2026-08-10", "days": [
            {"d": "Mon", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Full rest. Sleep, hydrate, foam roll."},
            {"d": "Tue", "type": "easy", "badge": "Easy run", "km": 8.0, "pace": "6:30-6:50/km", "instr": "Easy run. Recovery week."},
            {"d": "Wed", "type": "tempo", "badge": "Tempo run", "km": 13.0, "pace": "5:00-5:10 (tempo) / 6:30+ (W/U+C/D)", "instr": "2 km easy, 9 km at 5:00-5:10/km, 2 km easy. Recovery week - don't chase the pace."},
            {"d": "Thu", "type": "easy", "badge": "Easy run", "km": 8.0, "pace": "6:30-6:50/km", "instr": "Easy recovery run."},
            {"d": "Fri", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Rest or optional cross-training."},
            {"d": "Sat", "type": "pace", "badge": "Pace run", "km": 11.0, "pace": "5:20-5:30/km", "instr": "Goal marathon pace. Hold it and relax."},
            {"d": "Sun", "type": "long", "badge": "Long run", "km": 19.0, "pace": "6:30-7:00/km", "instr": "Recovery long run. Back off from last week."},
        ]},
    ]},
    {"phase": "Peak 2", "weeks": [
        {"n": 10, "start": "2026-08-17", "days": [
            {"d": "Mon", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Full rest. Sleep, hydrate, foam roll."},
            {"d": "Tue", "type": "easy", "badge": "Easy run", "km": 8.0, "pace": "6:30-6:50/km", "instr": "Conversational pace. HR <145 bpm."},
            {"d": "Wed", "type": "tempo", "badge": "Tempo run", "km": 13.0, "pace": "5:00-5:10 (tempo) / 6:30+ (W/U+C/D)", "instr": "2 km easy, 9 km at 5:00-5:10/km, 2 km easy cool-down."},
            {"d": "Thu", "type": "easy", "badge": "Easy run", "km": 8.0, "pace": "6:30-6:50/km", "instr": "Easy recovery run after tempo."},
            {"d": "Fri", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Rest or optional cross-training."},
            {"d": "Sat", "type": "pace", "badge": "Pace run", "km": 11.0, "pace": "5:20-5:30/km", "instr": "Goal marathon pace. Race rehearsal."},
            {"d": "Sun", "type": "long", "badge": "Long run", "km": 32.0, "pace": "6:30-7:00/km", "instr": "First 32 km! Easy the whole way. Fuel every 45 min. Big confidence builder."},
        ]},
    ]},
    {"phase": "Recovery", "weeks": [
        {"n": 11, "start": "2026-08-24", "days": [
            {"d": "Mon", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Full rest. Your legs need this after 32 km."},
            {"d": "Tue", "type": "easy", "badge": "Easy run", "km": 8.0, "pace": "6:30-6:50/km", "instr": "Easy run. Take stock of how your legs feel."},
            {"d": "Wed", "type": "tempo", "badge": "Tempo run", "km": 13.0, "pace": "5:00-5:10 (tempo) / 6:30+ (W/U+C/D)", "instr": "2 km easy, 9 km at 5:00-5:10/km, 2 km easy. Recovery week."},
            {"d": "Thu", "type": "easy", "badge": "Easy run", "km": 8.0, "pace": "6:30-6:50/km", "instr": "Easy recovery run."},
            {"d": "Fri", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Rest or optional cross-training."},
            {"d": "Sat", "type": "pace", "badge": "Pace run", "km": 11.0, "pace": "5:20-5:30/km", "instr": "Goal marathon pace."},
            {"d": "Sun", "type": "long", "badge": "Long run", "km": 19.0, "pace": "6:30-7:00/km", "instr": "Recovery long run. Back off from last week."},
        ]},
    ]},
    {"phase": "Peak 3", "weeks": [
        {"n": 12, "start": "2026-08-31", "days": [
            {"d": "Mon", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Full rest. Sleep, hydrate, foam roll."},
            {"d": "Tue", "type": "easy", "badge": "Easy run", "km": 8.0, "pace": "6:30-6:50/km", "instr": "Conversational pace. HR <145 bpm."},
            {"d": "Wed", "type": "tempo", "badge": "Tempo run", "km": 14.0, "pace": "5:00-5:10 (tempo) / 6:30+ (W/U+C/D)", "instr": "2 km easy, 10 km at 5:00-5:10/km, 2 km easy. Your strongest tempo yet."},
            {"d": "Thu", "type": "easy", "badge": "Easy run", "km": 8.0, "pace": "6:30-6:50/km", "instr": "Easy recovery run after tempo."},
            {"d": "Fri", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Rest or optional cross-training."},
            {"d": "Sat", "type": "pace", "badge": "Pace run", "km": 11.0, "pace": "5:20-5:30/km", "instr": "Goal marathon pace. Race rehearsal."},
            {"d": "Sun", "type": "long", "badge": "Long run", "km": 32.0, "pace": "6:30-7:00/km", "instr": "Second and final 32 km. You know how to do this now. Easy, fuel every 45 min."},
        ]},
    ]},
    {"phase": "Recovery", "weeks": [
        {"n": 13, "start": "2026-09-07", "days": [
            {"d": "Mon", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Full rest. Absorb that 32 km run."},
            {"d": "Tue", "type": "easy", "badge": "Easy run", "km": 8.0, "pace": "6:30-6:50/km", "instr": "Easy run. Recovery week."},
            {"d": "Wed", "type": "tempo", "badge": "Tempo run", "km": 13.0, "pace": "5:00-5:10 (tempo) / 6:30+ (W/U+C/D)", "instr": "2 km easy, 9 km at 5:00-5:10/km, 2 km easy. Keep it controlled."},
            {"d": "Thu", "type": "easy", "badge": "Easy run", "km": 8.0, "pace": "6:30-6:50/km", "instr": "Easy recovery run."},
            {"d": "Fri", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Rest or optional cross-training."},
            {"d": "Sat", "type": "pace", "badge": "Pace run", "km": 11.0, "pace": "5:20-5:30/km", "instr": "Goal marathon pace."},
            {"d": "Sun", "type": "long", "badge": "Long run", "km": 22.0, "pace": "6:30-7:00/km", "instr": "Recovery long run. Slightly longer to stay sharp before taper."},
        ]},
    ]},
    {"phase": "Final Build", "weeks": [
        {"n": 14, "start": "2026-09-14", "days": [
            {"d": "Mon", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Full rest. Sleep, hydrate, foam roll."},
            {"d": "Tue", "type": "easy", "badge": "Easy run", "km": 10.0, "pace": "6:30-6:50/km", "instr": "Conversational pace. Last big week - enjoy it."},
            {"d": "Wed", "type": "tempo", "badge": "Tempo run", "km": 14.0, "pace": "5:00-5:10 (tempo) / 6:30+ (W/U+C/D)", "instr": "2 km easy, 10 km at 5:00-5:10/km, 2 km easy. Your final big tempo of the plan."},
            {"d": "Thu", "type": "easy", "badge": "Easy run", "km": 10.0, "pace": "6:30-6:50/km", "instr": "Easy recovery run. After next week it's taper."},
            {"d": "Fri", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Rest or optional cross-training."},
            {"d": "Sat", "type": "pace", "badge": "Pace run", "km": 13.0, "pace": "5:20-5:30/km", "instr": "Goal marathon pace. Final big pace run."},
            {"d": "Sun", "type": "long", "badge": "Long run", "km": 26.0, "pace": "6:30-7:00/km", "instr": "Last long run before taper. Easy and fuelled - treat it like a dress rehearsal."},
        ]},
    ]},
    {"phase": "Taper 1", "weeks": [
        {"n": 15, "start": "2026-09-21", "days": [
            {"d": "Mon", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Full rest. The taper begins. Trust the process."},
            {"d": "Tue", "type": "easy", "badge": "Easy run", "km": 8.0, "pace": "6:30-6:50/km", "instr": "Easy run. You'll feel antsy - that's completely normal."},
            {"d": "Wed", "type": "medium", "badge": "Medium run", "km": 13.0, "pace": "6:00-6:30/km", "instr": "Taper week - easy-moderate. Let your body absorb the training."},
            {"d": "Thu", "type": "easy", "badge": "Easy run", "km": 8.0, "pace": "6:30-6:50/km", "instr": "Easy run. Trust the fitness you've built."},
            {"d": "Fri", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Rest or optional cross-training."},
            {"d": "Sat", "type": "pace", "badge": "Pace run", "km": 10.0, "pace": "5:20-5:30/km", "instr": "Goal marathon pace. Feel how fresh your legs are getting."},
            {"d": "Sun", "type": "long", "badge": "Long run", "km": 19.0, "pace": "6:30-7:00/km", "instr": "Reduced long run. Easy throughout."},
        ]},
    ]},
    {"phase": "Taper 2", "weeks": [
        {"n": 16, "start": "2026-09-28", "days": [
            {"d": "Mon", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Full rest. Taper madness is normal - your body is storing energy."},
            {"d": "Tue", "type": "easy", "badge": "Easy run", "km": 6.0, "pace": "6:30-6:50/km", "instr": "Short easy run. Legs should feel noticeably fresher."},
            {"d": "Wed", "type": "medium", "badge": "Medium run", "km": 11.0, "pace": "6:00-6:30/km", "instr": "Easy-moderate. You're in taper mode now."},
            {"d": "Thu", "type": "easy", "badge": "Easy run", "km": 6.0, "pace": "6:30-6:50/km", "instr": "Easy run. Enjoy the shorter distances."},
            {"d": "Fri", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Rest or optional cross-training."},
            {"d": "Sat", "type": "pace", "badge": "Pace run", "km": 8.0, "pace": "5:20-5:30/km", "instr": "Short taste of race pace. Feel it, don't work for it."},
            {"d": "Sun", "type": "long", "badge": "Long run", "km": 16.0, "pace": "6:30-7:00/km", "instr": "Easy long run. Last real distance before race day."},
        ]},
    ]},
    {"phase": "Taper 3", "weeks": [
        {"n": 17, "start": "2026-10-05", "days": [
            {"d": "Mon", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Full rest. Race is 11 days away - protect the legs."},
            {"d": "Tue", "type": "easy", "badge": "Easy run", "km": 6.0, "pace": "6:30-6:50/km", "instr": "Short easy run. Legs should feel great. Don't chase the feeling."},
            {"d": "Wed", "type": "medium", "badge": "Medium run", "km": 10.0, "pace": "6:00-6:30/km", "instr": "Easy-moderate. Keep it very relaxed."},
            {"d": "Thu", "type": "easy", "badge": "Easy run", "km": 6.0, "pace": "6:30-6:50/km", "instr": "Easy run. Short and relaxed."},
            {"d": "Fri", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Rest or optional cross-training."},
            {"d": "Sat", "type": "pace", "badge": "Pace run", "km": 8.0, "pace": "5:20-5:30/km", "instr": "Short pace run to stay sharp. A few km at race pace, nothing more."},
            {"d": "Sun", "type": "long", "badge": "Long run", "km": 13.0, "pace": "6:30-7:00/km", "instr": "Easy 13 km. Last run of any real length. Very easy."},
        ]},
    ]},
    {"phase": "Race Week", "weeks": [
        {"n": 18, "start": "2026-10-12", "days": [
            {"d": "Mon", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Full rest. Stay off your feet. Hydrate all day."},
            {"d": "Tue", "type": "easy", "badge": "Easy run", "km": 6.4, "pace": "6:30-7:00/km", "instr": "Easy shake-out. Short and gentle - just keep the legs moving."},
            {"d": "Wed", "type": "easy", "badge": "Easy shakeout", "km": 4.8, "pace": "6:30-7:00/km", "instr": "Very short, very easy. Loosen the legs, nothing more."},
            {"d": "Thu", "type": "easy", "badge": "Easy jog", "km": 3.2, "pace": "6:30-7:00/km", "instr": "Extremely light jog. Stay off your feet the rest of the day."},
            {"d": "Fri", "type": "rest", "badge": "Rest", "km": None, "pace": None, "instr": "Rest. Prepare race kit, pin bib, confirm start time, sleep early."},
            {"d": "Sat", "type": "rest", "badge": "Race eve", "km": None, "pace": None, "instr": "Full rest. Familiar carb dinner. In bed by 9:30 pm. Lay out all gear tonight."},
            {"d": "Sun", "type": "race", "badge": "Race day", "km": 42.2, "pace": "5:20-5:27/km", "instr": "Goal: Sub 3:50:00. Start conservative at 5:30-5:35/km for the first 10 km. Build through the middle. Push from km 30 if feeling strong. Fuel every 45 min. Trust your training."},
        ]},
    ]},
]
