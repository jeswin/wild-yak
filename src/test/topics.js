import { defPattern, defHook, enterTopic, exitTopic, exitAllTopics } from "../wild-yak";

export default function getTopics() {
  let env = {}

  const mainTopic = {
    onEntry: async ({context, session}, message) => {
      env._enteredMain = true;
      env._message = message;
      await exitTopic({context, session});
      if (env._mainCB) {
        return env._mainCB({context, session}, message);
      }
    }
  }

  const nicknameTopic = {
    onEntry: async ({context, session}, name) => {
      env._enteredNickname = true;
      env._name = name;
    },
    hooks: []
  }

  const mathTopic = {
    onEntry: async ({context, session}, result) => {
      env._enteredMath = true;
      env._result = result;
    }
  }

  const wildcardTopic = {
    onEntry: async ({context, session}, message) => {
      env._enteredWildcard = true;
      env._message = message;
      env._cb({context, session});
    }
  }

  const mathExpTopic = {
    onEntry: async ({context, session}, exp) => {
      env._enteredMathExp = true;
      env._exp = exp;
    }
  }

  async function onValidateName(_, {success, name}) {
    console.log(JSON.stringify(name));
    return `you signed up as ${name}.`;
  }

  const signupTopic = {
    onEntry: async ({context, session}, message) => {
      env._enteredSignup = true;
      env._message = message;
    },

    onValidateName,

    hooks: [
      defPattern(
        "validate",
        /^name (.*)$/,
        async ({context, session}, {matches}) => {
          // await exitAllTopics({context, session});
          return await enterTopic({context, session}, "validate", matches[1], onValidateName);
        }
      )
    ],
  }

  const validateTopic = {
    onEntry: async ({context, session}, name) => {
      env._enteredValidate = true;
      env._name = name;
      const result = await exitTopic({context, session}, {success:true, name});
      console.log(result);
      return result;
    }
  }

  const defaultTopic = {
    onEntry: async ({context, session}, message) => {
      env._enteredDefault = true;
      env._unknownMessage = message;
    }
  }

  const globalTopic = {
    hooks: [
      defPattern(
        "nickname",
        [/^nick ([A-z]\w*)$/, /^nickname ([A-z]\w*)$/],
        async ({context, session}, {matches}) => {
          await exitAllTopics({context, session});
          await enterTopic({context, session}, "nickname", matches[1])
        }
      ),
      defHook(
        "calc",
        async ({context, session}, message) => {
          const regex = /^[0-9\(\)\+\-*/\s]+$/;
          if (regex.exec(message.text) !== null) {
            try {
              return eval(message.text)
            } catch (e) {
              console.log(e)
            }
          }
        },
        async ({context, session}, result) => {
          await exitAllTopics({context, session});
          await enterTopic({context, session}, "math", result);
        }
      ),
      defPattern(
        "wildcard",
        [/^wildcard ([A-z].*)$/, /^wild ([A-z].*)$/],
        async ({context, session}, {matches}) => {
          await exitAllTopics({context, session});
          await enterTopic({context, session}, "wildcard", matches[1]);
        }
      ),
      defPattern(
        "mathexp",
        [/^5 \+ 10$/, /^100\/4$/],
        async ({context, session}, {matches}) => {
          await exitAllTopics({context, session});
          await enterTopic({context, session}, "mathexp", matches[0]);
        }
      ),
      defPattern(
        "signup",
        [/^signup (.*)$/, /^100\/4$/],
        async ({context, session}, {matches}) => {
          await exitAllTopics({context, session});
          await enterTopic({context, session}, "signup", matches[1]);
        }
      ),
      defHook(
        "default",
        async ({context, session}, message) => {
          return message
        },
        async ({context, session}, message) => {
          await enterTopic({context, session}, "default", message);
        }
      ),
    ]
  }

  const topics = {
    definitions: {
      "global": globalTopic,
      "main": mainTopic,
      "nickname": nicknameTopic,
      "math": mathTopic,
      "wildcard": wildcardTopic,
      "mathexp": mathExpTopic,
      "signup": signupTopic,
      "validate": validateTopic,
      "default": defaultTopic
    }
  };

  return {
    env,
    topics
  };
}
