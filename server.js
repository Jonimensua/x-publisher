import requests
import time
import os

BASE_RPC = "https://mainnet.base.org"

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
CHAT_ID = os.getenv("CHAT_ID")

PUBLISHER_URL = os.getenv("PUBLISHER_URL")

# filtro de contratos basura
GAS_THRESHOLD = 1500000

# evitar duplicados
seen_contracts = set()


def enviar_telegram(texto):

    if not TELEGRAM_TOKEN or not CHAT_ID:
        print("Telegram not configured")
        return

    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"

    data = {
        "chat_id": CHAT_ID,
        "text": texto
    }

    try:
        r = requests.post(url, data=data)
        print("Telegram response:", r.text)
    except Exception as e:
        print("Telegram error:", e)


def enviar_publisher(texto):

    if not PUBLISHER_URL:
        print("Publisher URL not set")
        return

    try:

        r = requests.post(
            PUBLISHER_URL,
            json={"content": texto}
        )

        print("Publisher status:", r.status_code)

    except Exception as e:
        print("Publisher error:", e)


def rpc_call(method, params):

    payload = {
        "jsonrpc": "2.0",
        "method": method,
        "params": params,
        "id": 1
    }

    try:
        r = requests.post(BASE_RPC, json=payload)
        return r.json()["result"]
    except:
        return None


def get_latest_block():

    result = rpc_call("eth_blockNumber", [])

    if result:
        return int(result, 16)

    return None


def get_block(num):

    return rpc_call(
        "eth_getBlockByNumber",
        [hex(num), True]
    )


def main():

    print("🔥 Base Contract Monitor iniciado")

    ultimo_bloque = get_latest_block()

    if not ultimo_bloque:
        print("Error getting initial block")
        return

    while True:

        try:

            time.sleep(10)

            bloque_actual = get_latest_block()

            if not bloque_actual:
                continue

            if bloque_actual > ultimo_bloque:

                block_data = get_block(bloque_actual)

                if not block_data:
                    continue

                for tx in block_data["transactions"]:

                    if tx["to"] is None:

                        gas_used = int(tx["gas"], 16)

                        if gas_used < GAS_THRESHOLD:
                            continue

                        contract_hash = tx["hash"]

                        if contract_hash in seen_contracts:
                            continue

                        seen_contracts.add(contract_hash)

                        valor_eth = int(tx["value"], 16) / (10**18)

                        mensaje = f"""
🚨 BASE CONTRACT DEPLOYED

Gas Used: {gas_used}
ETH Value: {valor_eth}

Tx
https://basescan.org/tx/{contract_hash}

#Base #OnChain
"""

                        print(mensaje)

                        enviar_telegram(mensaje)

                        enviar_publisher(mensaje)

                ultimo_bloque = bloque_actual

        except Exception as e:

            print("Main loop error:", e)

            time.sleep(5)


if __name__ == "__main__":
    main()
