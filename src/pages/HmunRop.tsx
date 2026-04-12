import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import munLogo from "@/assets/mun-ai-logo.png";

const sections = [
  {
    title: "1. General Rules",
    items: [
      "All proceedings shall be conducted in English.",
      "Delegates must maintain decorum at all times. The Chair may call delegates to order.",
      "Electronic devices may only be used for research during unmoderated caucuses unless otherwise specified by the Chair.",
      "Delegates must address each other by their delegation name, never by personal name.",
      "The Chair's ruling on all procedural matters is final and binding.",
      "Delegates may not interrupt a speaker except on a Point of Order or Point of Personal Privilege.",
    ],
  },
  {
    title: "2. Quorum",
    items: [
      "A simple majority (50% + 1) of member states constitutes a quorum.",
      "The Chair shall confirm quorum at the beginning of each session through a roll call vote.",
      "If quorum is not met, formal session cannot proceed.",
    ],
  },
  {
    title: "3. Roll Call",
    items: [
      "Delegates respond 'Present' or 'Present and Voting' when their delegation is called.",
      "'Present and Voting' delegates cannot abstain on substantive votes.",
      "'Present' delegates may abstain on substantive votes.",
    ],
  },
  {
    title: "4. General Speakers List (GSL)",
    items: [
      "The GSL is the default mode of debate when no other motion is on the floor.",
      "Delegates are added to the GSL by raising their placards or submitting a request to the dais.",
      "Speaking time on the GSL is set by the Chair (typically 60–120 seconds).",
      "A delegate may yield their remaining time in one of three ways: yield to the Chair, yield to another delegate, or yield to questions.",
      "When the GSL is exhausted (no speakers remaining), the committee moves directly to voting procedure on any draft resolutions on the floor.",
    ],
  },
  {
    title: "5. Motions",
    content: "All motions require a second. Procedural motions are voted on by simple majority (raise of placards). Motions are entertained in the following order of precedence:",
    items: [
      "Motion to Adjourn the Meeting (highest precedence) — Ends the current session entirely.",
      "Motion to Suspend the Meeting — Temporarily suspends debate (e.g. for lunch break).",
      "Motion to Adjourn Debate — Tables the current topic. Requires a speaker for and against.",
      "Motion to Close Debate — Moves directly to voting procedure. Requires two speakers against. Requires a two-thirds majority to pass.",
      "Motion for a Moderated Caucus — Delegate specifies topic, total time, and individual speaking time.",
      "Motion for an Unmoderated Caucus — Delegate specifies total time. Informal lobbying.",
      "Motion to Set the Agenda — Used at the start of committee to determine which topic to discuss first.",
    ],
  },
  {
    title: "6. Points",
    items: [
      "Point of Order — Raised when a delegate believes the Chair or another delegate has made a procedural error. Cannot interrupt a speaker except in rare cases.",
      "Point of Personal Privilege — Raised when a delegate experiences physical discomfort (e.g. cannot hear the speaker). May interrupt a speaker.",
      "Point of Parliamentary Inquiry — A question directed to the Chair about the rules of procedure. Cannot interrupt a speaker.",
      "Point of Information (POI) — A question directed to the current speaker. May only be asked after a speaker yields to questions. POIs must be phrased as questions.",
      "Right of Reply — A delegate may request a right of reply if they feel their national or personal integrity has been impugned. Granted at the Chair's discretion.",
    ],
  },
  {
    title: "7. Moderated Caucus",
    items: [
      "A delegate proposes a moderated caucus with a specific topic, total time, and individual speaking time.",
      "The Chair calls on delegates to speak in turn.",
      "No yields are permitted during a moderated caucus.",
      "The Chair may extend the caucus upon a motion from the floor.",
      "The caucus ends when time expires or speakers are exhausted.",
    ],
  },
  {
    title: "8. Unmoderated Caucus",
    items: [
      "Delegates leave their seats and negotiate informally.",
      "The Chair may circulate to observe but does not direct debate.",
      "Used primarily for bloc formation, working paper drafting, and coalition-building.",
      "The Chair calls the committee back to order when time expires.",
    ],
  },
  {
    title: "9. Working Papers, Draft Resolutions, and Amendments",
    items: [
      "Working Papers are informal documents used during caucuses. They do not require signatories and are not debated formally.",
      "Draft Resolutions are formal documents introduced to the committee. They require a minimum number of sponsors (typically 20% of committee membership) and signatories (typically 20%).",
      "Sponsors support the content; signatories merely wish to see it debated.",
      "Friendly Amendments are changes accepted by all sponsors. They are automatically incorporated.",
      "Unfriendly Amendments are changes NOT accepted by all sponsors. They must be voted on separately before the draft resolution.",
      "All documents must be submitted to the dais for approval before introduction to the committee.",
    ],
  },
  {
    title: "10. Voting Procedure",
    items: [
      "Voting procedure begins when the Motion to Close Debate passes.",
      "The committee enters 'Voting Bloc' — no one may enter or leave the room. No communication with non-delegates.",
      "Unfriendly amendments are voted on first (simple majority).",
      "Draft resolutions are then voted on (simple majority, unless the topic is designated as 'important' — then two-thirds majority).",
      "Voting options: For, Against, Abstain (abstain not available if 'Present and Voting').",
      "Procedural votes (motions) are always by simple majority and abstention is not permitted.",
      "Roll Call Vote: Any delegate may motion for a roll call vote, where each delegation is called individually. Delegates respond: Yes, No, Abstain, Yes with Rights, or No with Rights. 'With Rights' allows a brief explanation of vote after all delegations have voted.",
      "A 'Division of the Question' may be motioned to vote on operative clauses separately.",
    ],
  },
  {
    title: "11. Crisis Committees (Special Rules)",
    items: [
      "Crisis committees operate under modified rules at the Chair's discretion.",
      "Crisis notes (communiqués) may be sent by delegates to the crisis staff at any time.",
      "The backroom (crisis staff) sends crisis updates ('injections') that alter the scenario.",
      "Directives replace resolutions. They are shorter, action-oriented, and voted on by simple majority.",
      "Portfolio powers allow individual delegates to take actions specific to their character/role.",
      "The pace is significantly faster; speaking times and caucus durations are often shorter.",
      "The Chair and crisis staff have greater latitude to modify procedures as the scenario demands.",
    ],
  },
  {
    title: "12. Procedural Hierarchy",
    content: "When multiple motions are on the floor, they are entertained in order of most disruptive first:",
    items: [
      "1. Adjourn the Meeting",
      "2. Suspend the Meeting",
      "3. Adjourn Debate",
      "4. Close Debate",
      "5. Moderated Caucus (shortest duration first)",
      "6. Unmoderated Caucus (shortest duration first)",
      "7. Extension of previous caucus",
    ],
  },
];

const HmunRop = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#efeeea] p-4">
      <div className="max-w-3xl mx-auto pt-6 pb-12 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
          <img src={munLogo} alt="MUN AI" className="h-10 object-contain" />
          <div>
            <h1 className="font-display text-xl font-bold text-foreground flex items-center gap-2"><BookOpen className="w-5 h-5 text-accent" /> HMUN Rules of Procedure</h1>
            <p className="text-xs text-muted-foreground">Harvard Model United Nations — Complete ROP Reference</p>
          </div>
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.title} className="glass-card rounded-2xl p-5">
              <h2 className="font-display font-bold text-foreground text-base mb-3">{section.title}</h2>
              {section.content && <p className="text-sm text-muted-foreground mb-3">{section.content}</p>}
              <ul className="space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="text-sm text-foreground leading-relaxed pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-accent">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HmunRop;
