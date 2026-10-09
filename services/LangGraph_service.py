from typing import TypedDict
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from groq import Groq
import os

from services.Laya_service import analyze_ticket

load_dotenv()

# ============================================================
# Groq
# ============================================================

groq_client = Groq()

GROQ_MODEL = "openai/gpt-oss-120b"

# Keywords that always force human escalation regardless of scores
HUMAN_KEYWORDS = [
    "legal action", "lawsuit", "lawyer", "attorney",
    "fraud", "unauthorized access", "hacked", "security breach",
    "threatening", "sue you", "court",
]


# ============================================================
# LangGraph State
# ============================================================

class SupportState(TypedDict, total=False):

    user_message: str

    department: str
    department_confidence: float

    urgency: str
    urgency_score: float
    urgency_confidence: float

    refund_probability: float
    human_review_probability: float

    route: str
    response: str


# ============================================================
# NODE 1 — Laya Analysis
# ============================================================

def laya_analysis(state: SupportState):

    ticket = state["user_message"]
    decision = analyze_ticket(ticket)

    return {
        "department":             decision.department,
        "department_confidence":  decision.department_confidence,
        "urgency":                decision.urgency,
        "urgency_score":          decision.urgency_score,
        "urgency_confidence":     decision.urgency_confidence,
        "refund_probability":     decision.refund_probability,
        "human_review_probability": decision.human_review_probability,
    }


# ============================================================
# NODE 2 — Route Ticket
# Routing is deterministic — does NOT rely on Laya's
# human_review score because that score is unreliable.
# We use urgency label + explicit keyword matching only.
# ============================================================

def route_ticket(state: SupportState):

    urgency = state.get("urgency", "low")
    message = state.get("user_message", "").lower()

    # Hard escalation: explicit legal / security keywords
    for kw in HUMAN_KEYWORDS:
        if kw in message:
            return {"route": "human"}

    # Hard escalation: only true critical urgency
    if urgency == "critical":
        return {"route": "human"}

    # Everything else: AI handles it
    return {"route": "llm"}


# ============================================================
# NODE 3A — Human Escalation
# ============================================================

def human_escalation(state: SupportState):

    urgency    = state.get("urgency", "low")
    department = state.get("department", "general")

    response = (
        f"Thank you for reaching out. Your {department} request has been "
        f"flagged as {urgency} urgency and requires direct attention from "
        f"one of our specialist advisors. A member of our team will contact "
        f"you within 1 business hour. Your case has been prioritised."
    )

    return {"response": response}


# ============================================================
# NODE 3B — LLM Response
# ============================================================

def generate_response(state: SupportState):

    user_message      = state["user_message"]
    department        = state.get("department", "general")
    urgency           = state.get("urgency", "low")
    urgency_score     = state.get("urgency_score", 0.0)
    refund_probability = state.get("refund_probability", 0.0)

    prompt = f"""You are an AI customer support assistant for a SaaS company.

Provide a professional, concise and helpful response to the customer.
Do not invent policies, refunds, transactions or facts not provided.
Do not mention Laya, LangGraph, probabilities, routing or system internals.

Customer message:
{user_message}

Context from ticket analysis:
- Department: {department}
- Urgency: {urgency} (score: {urgency_score})
- Refund related: {"yes" if refund_probability > 0.5 else "no"}

Write the final customer-facing response now."""

    completion = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are a professional customer support assistant for a SaaS company.",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=0.3,
        stream=False,
    )

    return {"response": completion.choices[0].message.content}


# ============================================================
# Conditional edge
# ============================================================

def decide_next_node(state: SupportState):
    if state["route"] == "human":
        return "human_escalation"
    return "generate_response"


# ============================================================
# Build graph
# ============================================================

def build_graph():

    graph = StateGraph(SupportState)

    graph.add_node("laya_analysis",     laya_analysis)
    graph.add_node("route_ticket",      route_ticket)
    graph.add_node("human_escalation",  human_escalation)
    graph.add_node("generate_response", generate_response)

    graph.set_entry_point("laya_analysis")
    graph.add_edge("laya_analysis", "route_ticket")

    graph.add_conditional_edges(
        "route_ticket",
        decide_next_node,
        {
            "human_escalation":  "human_escalation",
            "generate_response": "generate_response",
        }
    )

    graph.add_edge("human_escalation",  END)
    graph.add_edge("generate_response", END)

    return graph.compile()


support_graph = build_graph()
