from laya import Router
from dataclasses import dataclass


# ============================================================
# 1. Load Laya once
# ============================================================

print("⏳ Loading Laya router...")
router = Router(preload=True)
print("✅ Laya router ready.\n")


# ============================================================
# 2. Structured decision output
# ============================================================

@dataclass
class LayaDecision:
    department: str
    department_confidence: float
    urgency: str
    urgency_confidence: float
    urgency_score: float
    refund_probability: float
    human_review_probability: float
    model: str = "laya"


# ============================================================
# 3. Laya questions
# ============================================================

QUESTIONS = {

    "department": {
        "type": "choice",

        "instructions": """
Determine which customer support department should handle
the ticket.

Choose exactly one department based on the customer's
actual problem.
""",

        "criteria": {

            "billing": """
Charges, invoices, payments, refunds, subscriptions,
pricing, duplicate charges, failed payments, or money-related
issues.
""",

            "technical": """
Bugs, errors, crashes, integrations, API problems,
login failures caused by technical issues, or product
functionality problems.
""",

            "account": """
Profile changes, permissions, account settings,
identity, access, password, or account-management issues.
""",

            "general": """
Questions that do not clearly belong to billing,
technical, or account support.
"""
        }
    },


    "urgency": {
        "type": "score",

        "instructions": """
Determine how urgent the customer's request is.

Use the following scale:

0-1: Low
2: Medium
3: High
4: Critical
""",

        "criteria": [
            "Low: informational question or no meaningful time pressure",

            "Medium: customer is inconvenienced or partially blocked",

            "High: significant business impact, repeated failure, or customer explicitly needs fast assistance",

            "Critical: severe financial/security impact, major data issue, or complete business stoppage"
        ]
    },


    "refund_related": {
        "type": "noul",

        "instructions": """
Determine whether the customer is asking for,
expecting, disputing, or clearly discussing a refund,
charge reversal, reimbursement, or duplicate payment.
"""
    },


    "human_review": {
        "type": "noul",

        "instructions": """
Determine whether this ticket STRICTLY requires a human agent
and CANNOT be handled by an AI assistant at all.

Only score high (above 0.75) when ALL of the following are true:
- The issue involves a confirmed security breach or fraud
- OR the customer is threatening legal action explicitly
- OR the issue requires direct access to internal systems
  that only a human agent can operate

Score LOW (below 0.4) for:
- Billing questions, even refund requests
- Technical errors and API issues
- Account changes like email or password
- General product questions
- Subscription changes
- Any issue an AI can reasonably explain or guide

Default to LOW unless there is a clear, specific reason
that only a human can resolve this.
"""
    }
}


# ============================================================
# 4. Ticket analyzer
# ============================================================

def analyze_ticket(ticket: str) -> LayaDecision:

    result = router.predict(
        {"body": ticket},
        QUESTIONS
    )

    answers = result["answers"]

    # -------------------------
    # Department
    # -------------------------

    department_answer = answers["department"]

    department = department_answer["choice"]

    department_confidence = round(
        float(department_answer["confidence"]),
        3
    )

    # -------------------------
    # Urgency
    # -------------------------

    urgency_answer = answers["urgency"]

    urgency_score = float(
        urgency_answer["score"]
    )

    urgency_confidence = round(
        float(urgency_answer["confidence"]),
        3
    )

    # Convert numeric urgency into label
    if urgency_score >= 3.5:
        urgency = "critical"

    elif urgency_score >= 2.5:
        urgency = "high"

    elif urgency_score >= 1.5:
        urgency = "medium"

    else:
        urgency = "low"

    # -------------------------
    # Refund
    # -------------------------

    refund_probability = round(
        float(answers["refund_related"]["noul"]),
        3
    )

    # -------------------------
    # Human review
    # -------------------------

    human_review_probability = round(
        float(answers["human_review"]["noul"]),
        3
    )

    return LayaDecision(

        department=department,

        department_confidence=department_confidence,

        urgency=urgency,

        urgency_confidence=urgency_confidence,

        urgency_score=round(urgency_score, 3),

        refund_probability=refund_probability,

        human_review_probability=human_review_probability,

        model="laya"
    )