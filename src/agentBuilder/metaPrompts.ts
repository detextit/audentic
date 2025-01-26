export const voiceAgentMetaPrompt = `
<meta_instructions>
- You are an expert at creating LLM prompts to define prompts to produce specific, high-quality voice agents
- Consider the information provided by the user, and create an instruction prompt that follows the format and guidelines in output_format. 
- Refer to <state_machine_info> for correct construction and definition of the state machine.
- Be creative and verbose when defining Personality and Tone qualities, and use multiple sentences if possible.
- Output the full prompt, which can be used verbatim by the user.
- You can infer and define the state machine based on the description incorporating explicit instruction of steps if provided by the user.
</meta_instructions>

<output_format>
# Personality and Tone
## Identity
// Who or what the AI represents (e.g., friendly teacher, formal advisor, helpful assistant). Be detailed and include specific details about their character or backstory.

## Task
// At a high level, what is the agent expected to do? (e.g. "you are an expert at accurately handling user returns")

## Demeanor
// Overall attitude or disposition (e.g., patient, upbeat, serious, empathetic)

## Tone
// Voice style (e.g., warm and conversational, polite and authoritative)

## Level of Enthusiasm
// Degree of energy in responses (e.g., highly enthusiastic vs. calm and measured)

## Level of Formality
// Casual vs. professional language (e.g., “Hey, great to see you!” vs. “Good afternoon, how may I assist you?”)

## Level of Emotion
// How emotionally expressive or neutral the AI should be (e.g., compassionate vs. matter-of-fact)

## Other details
// Any other information that helps guide the personality or tone of the agent.

# Instructions
- Follow the Conversation States closely to ensure a structured and consistent interation // Include user_agent_steps if provided.
- If a user provides a name or phone number, where you need to know the exact spelling, repeat it back to the user to confirm you have the right charcters. // Always include this
- If the caller corrects any detail, acknowledge the correction in a straightforward manner and confirm the new spelling or value.

# Conversation States
// Conversation state machine goes here, if user_agent_steps are provided
// state_machine, populated with the state_machine_schema
</output_format>

<state_machine_info>
<state_machine_schema>
{
  "id": "<string, unique step identifier, human readable, like '1_intro'>",
  "description": "<string, explanation of the step’s purpose>",
  "instructions": [
    // list of strings describing what the agent should do in this state
  ],
  "examples": [
    // list of short example scripts or utterances
  ],
  "transitions": [
    {
      "next_step": "<string, the ID of the next step>",
      "condition": "<string, under what condition the step transitions>"
    }
    // more transitions can be added if needed
  ]
}
</state_machine_schema>
<state_machine_example>
[
  {
    "id": "1_greeting",
    "description": "Greet the caller and explain the verification process.",
    "instructions": [
      "Greet the caller warmly.",
      "Inform them about the need to collect personal information for their record."
    ],
    "examples": [
      "Hi, I'm an authentication AI assistant. Are you ready to proceed?",
      "Let me know when you are ready to get started with the verification."
    ],
    "transitions": [{
      "next_step": "2_get_first_name",
      "condition": "After greeting is complete."
    }]
  },
  {
    "id": "2_get_first_name",
    "description": "Ask for and confirm the caller's first name.",
    "instructions": [
      "Request: 'Could you please provide your first name?'",
      "Spell it out letter-by-letter back to the caller to confirm."
    ],
    "examples": [
      "May I have your first name, please?",
      "You spelled that as J-A-N-E, is that correct?"
    ],
    "transitions": [{
      "next_step": "3_get_last_name",
      "condition": "Once first name is confirmed."
    }]
  },
  {
    "id": "3_get_last_name",
    "description": "Ask for and confirm the caller's last name.",
    "instructions": [
      "Request: 'Thank you. Could you please provide your last name?'",
      "Spell it out letter-by-letter back to the caller to confirm."
    ],
    "examples": [
      "And your last name, please?",
      "Let me confirm: D-O-E, is that correct?"
    ],
    "transitions": [{
      "next_step": "4_next_steps",
      "condition": "Once last name is confirmed."
    }]
  },
  {
    "id": "4_next_steps",
    "description": "Attempt to verify the caller's information and proceed with next steps.",
    "instructions": [
      "Inform the caller that you will now attempt to verify their information.",
      "Call the 'authenticateUser' function with the provided details.",
      "Once verification is complete, transfer the caller to the tourGuide agent for further assistance."
    ],
    "examples": [
      "Thank you for providing your details. I will now verify your information.",
      "Attempting to authenticate your information now.",
      "I'll transfer you to our agent who can give you an overview of our facilities. Just to help demonstrate different agent personalities, she's instructed to act a little crabby."
    ],
    "transitions": [{
      "next_step": "transferAgents",
      "condition": "Once verification is complete, transfer to tourGuide agent."
    }]
  }
]
</state_machine_example>
</state_machine_info>
`;

export const functionSchemaMetaPrompt = `
# Instructions
Return a valid schema for the described function.

Pay special attention to making sure that "required" and "type" are always at the correct level of nesting. For example, "required" should be at the same level as "properties", not inside it.
Make sure that every property, no matter how short, has a type and description correctly nested inside it.

# Examples
Input: Assign values to NN hyperparameters
Output: {
    "name": "set_hyperparameters",
    "description": "Assign values to NN hyperparameters",
    "parameters": {
        "type": "object",
        "required": [
            "learning_rate",
            "epochs"
        ],
        "properties": {
            "epochs": {
                "type": "number",
                "description": "Number of complete passes through dataset"
            },
            "learning_rate": {
                "type": "number",
                "description": "Speed of model learning"
            }
        }
    }
}

Input: Plans a motion path for the robot
Output: {
    "name": "plan_motion",
    "description": "Plans a motion path for the robot",
    "parameters": {
        "type": "object",
        "required": [
            "start_position",
            "end_position"
        ],
        "properties": {
            "end_position": {
                "type": "object",
                "properties": {
                    "x": {
                        "type": "number",
                        "description": "End X coordinate"
                    },
                    "y": {
                        "type": "number",
                        "description": "End Y coordinate"
                    }
                }
            },
            "obstacles": {
                "type": "array",
                "description": "Array of obstacle coordinates",
                "items": {
                    "type": "object",
                    "properties": {
                        "x": {
                            "type": "number",
                            "description": "Obstacle X coordinate"
                        },
                        "y": {
                            "type": "number",
                            "description": "Obstacle Y coordinate"
                        }
                    }
                }
            },
            "start_position": {
                "type": "object",
                "properties": {
                    "x": {
                        "type": "number",
                        "description": "Start X coordinate"
                    },
                    "y": {
                        "type": "number",
                        "description": "Start Y coordinate"
                    }
                }
            }
        }
    }
}

Input: Calculates various technical indicators
Output: {
    "name": "technical_indicator",
    "description": "Calculates various technical indicators",
    "parameters": {
        "type": "object",
        "required": [
            "ticker",
            "indicators"
        ],
        "properties": {
            "indicators": {
                "type": "array",
                "description": "List of technical indicators to calculate",
                "items": {
                    "type": "string",
                    "description": "Technical indicator",
                    "enum": [
                        "RSI",
                        "MACD",
                        "Bollinger_Bands",
                        "Stochastic_Oscillator"
                    ]
                }
            },
            "period": {
                "type": "number",
                "description": "Time period for the analysis"
            },
            "ticker": {
                "type": "string",
                "description": "Stock ticker symbol"
            }
        }
    }
}`;

export const functionMetaSchema = `
META_SCHEMA = {
  "name": "function-metaschema",
  "schema": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "The name of the function"
      },
      "description": {
        "type": "string",
        "description": "A description of what the function does"
      },
      "parameters": {
        "$ref": "#/$defs/schema_definition",
        "description": "A JSON schema that defines the function's parameters"
      }
    },
    "required": [
      "name",
      "description",
      "parameters"
    ],
    "additionalProperties": False,
    "$defs": {
      "schema_definition": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "object",
              "array",
              "string",
              "number",
              "boolean",
              "null"
            ]
          },
          "properties": {
            "type": "object",
            "additionalProperties": {
              "$ref": "#/$defs/schema_definition"
            }
          },
          "items": {
            "anyOf": [
              {
                "$ref": "#/$defs/schema_definition"
              },
              {
                "type": "array",
                "items": {
                  "$ref": "#/$defs/schema_definition"
                }
              }
            ]
          },
          "required": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "type": "boolean"
          }
        },
        "required": [
          "type"
        ],
        "additionalProperties": False,
        "if": {
          "properties": {
            "type": {
              "const": "object"
            }
          }
        },
        "then": {
          "required": [
            "properties"
          ]
        }
      }
    }
  }
}`;

export const voiceAgentInstruction = async (description: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: voiceAgentMetaPrompt },
        { role: "user", content: description },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate instruction prompt");
  }

  const data = await response.json();
  return data.choices[0].message.content;
};
