import { Show, createSignal } from "solid-js";
import { A } from "@solidjs/router";
import { createStore } from "solid-js/store";
import { toggleShowLogin } from "../store/showLogin";
import { validate, validated } from "../helpers/validations";
import { stringifiedKeypair, stringifyKeypair } from "../crypto";
import idl from "../assets/encrypted.json";
import { program } from "../store/program";
import { Program, web3 } from "@coral-xyz/anchor";
import { walletPubkey } from "./Header";

const ErrorMessage = (props) => (
  <span class="text-sm text-right text-red-400">{props.error}</span>
);

const FIELDS = { username: null, password: null };

const SignupComponent = () => {
  const [fields, setFields] = createStore();
  const [errors, setErrors] = createSignal(FIELDS);

  const updateField = (e) => {
    const name = e.currentTarget.name;
    setFields([name], e.currentTarget.value);
    setErrors((prev) => ({ ...prev, ...validate(fields, name) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    console.log("clicked on submit");
    // setErrors(validate(fields));
    console.log("fields: ", fields);
    if (program()) {
      console.log("encryption key: ", stringifiedKeypair.publicKey);
      const [registryAccount, bump] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("registry"), Buffer.from(fields.username)],
        new web3.PublicKey(idl.metadata.address)
      );
      console.log("registryAccount: ", registryAccount.toString());
      console.log("username: ", fields.username);

      let results = await program()
        .methods.register(fields.username, stringifiedKeypair.publicKey)
        .accounts({
          registryAccount: registryAccount.toString(),
          signer: walletPubkey().publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      console.log("registry: ", results);

      results = await program().account.registryAccount.all();
      console.log("get all registries: ", results);
    }
    console.log("SUBMIT");
  };

  return (
    <div class="h-full flex flex-col justify-between items-center">
      <div class="flex flex-col items-center">
        {/* header */}
        <h1 class="text-3xl">Create your account</h1>
        <p class="mt-2 text-sm text-center max-w">
          Already registered?
          <A
            class="ml-1 font-semibold underline text-blue-400 hover:text-blue-300 hover:border-blue-300"
            href="#"
            onClick={toggleShowLogin}
            tabIndex="0"
          >
            Sign in
          </A>
        </p>

        <hr class="my-2 sm:my-4 border-zinc-400" />

        {/* form */}
        <form
          class="py-4 px-6 sm:px-8 sm:py-10 h-fit xs:w-96 sm:w-full rounded-md bg-zinc-700"
          onSubmit={submit}
        >
          {/* username */}
          <label for="username" class="flex justify-between text-gray-300 ">
            Username:
            <Show when={errors().username}>
              <ErrorMessage error={errors().username} />
            </Show>
          </label>
          <input
            name="username"
            id="username"
            type="username"
            placeholder="Username"
            autocomplete="username"
            class="w-full p-2 mt-1 mb-2 sm:mb-4 text-black bg-zinc-300 rounded ring-blue-900"
            required
            onInput={updateField}
            onBlur={updateField}
          />

          <Show
            when={stringifiedKeypair}
            fallback={
              <button onClick={stringifyKeypair}>Generate password</button>
            }
          >
            {/* Password */}
            <label for="password" class="flex justify-between text-gray-300">
              Password:
              <Show when={errors().password}>
                <ErrorMessage error={errors().password} />
              </Show>
            </label>

            <input
              type="password"
              name="password"
              id="password"
              required
              class="w-full p-2 mt-1 mb-2 sm:mb-4 text-black bg-zinc-300 rounded"
              value={stringifiedKeypair?.privateKey}
            />
          </Show>

          {/* Submit button */}
          <div className="flex justify-center">
            <button
              type="submit"
              class={`
                mt-4 py-2 text-lg font-bold border w-[70%] rounded
                text-blue-500hover:text-blue-300
                border-blue-500  hover:border-blue-300
              `}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupComponent;
