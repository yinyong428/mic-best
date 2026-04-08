"""
LangGraph BOM Agent — compiled state machine.
"""

from langgraph.graph import StateGraph, END
from .state import AgentState
from . import nodes


def build_bom_agent() -> StateGraph:
    """
    Build the BOM agent graph.

    Flow:
        supervisor → think → [route] → search → generate_bom → END
                                 └→ generate_bom → END
    """
    graph = StateGraph(AgentState)

    # Nodes
    graph.add_node("supervisor", nodes.supervisor)
    graph.add_node("think", nodes.think)
    graph.add_node("search", nodes.search)
    graph.add_node("generate_bom", nodes.generate_bom)

    # Edges
    graph.add_edge("supervisor", "think")
    graph.add_conditional_edges(
        "think",
        nodes.route_after_think,
        {
            "search": "search",
            "generate_bom": "generate_bom",
        },
    )
    graph.add_conditional_edges(
        "search",
        nodes.route_after_search,
        {
            "generate_bom": "generate_bom",
        },
    )
    graph.add_edge("generate_bom", END)

    # Entry
    graph.set_entry_point("supervisor")

    return graph.compile()
